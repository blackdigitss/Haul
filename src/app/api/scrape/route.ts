import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { ScrapeResult, SellerContact } from "@/types";

// Price parsing patterns
function parsePrice(text: string): number | null {
  // Math expression: (¥100 + ¥50)
  const mathMatch = text.match(
    /\(\s*[¥￥]\s*(\d+(?:[.,]\d+)?)\s*\+\s*[¥￥]\s*(\d+(?:[.,]\d+)?)\s*\)/
  );
  if (mathMatch) {
    return (
      parseFloat(mathMatch[1].replace(",", "")) +
      parseFloat(mathMatch[2].replace(",", ""))
    );
  }

  // Standard: ¥500, ￥500
  const symbolMatch = text.match(/[¥￥]\s*(\d+(?:[.,]\d+)?)/);
  if (symbolMatch) {
    return parseFloat(symbolMatch[1].replace(",", ""));
  }

  // Text: CNY 500, 500 yuan, 500 rmb
  const textMatch = text.match(
    /(?:CNY|RMB)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:yuan|rmb|cny)/i
  );
  if (textMatch) {
    const val = textMatch[1] || textMatch[2];
    return parseFloat(val.replace(",", ""));
  }

  // Bare numbers near currency context (fallback)
  const bareMatch = text.match(/(?:price|cost|usd|\$)\s*:?\s*(\d+(?:\.\d+)?)/i);
  if (bareMatch) {
    return parseFloat(bareMatch[1]);
  }

  return null;
}

function extractContact(text: string): SellerContact {
  const contact: SellerContact = {};

  // WhatsApp
  const waMatch = text.match(
    /(?:whatsapp|wa|wsp)[:\s]*\+?(\d[\d\s-]{8,})/i
  );
  if (waMatch) contact.whatsapp = waMatch[1].replace(/[\s-]/g, "");

  // WeChat
  const wxMatch = text.match(
    /(?:wechat|weixin|wx)[:\s]*([a-zA-Z0-9_-]+)/i
  );
  if (wxMatch) contact.wechat = wxMatch[1];

  return contact;
}

function extractWeidianUrl(html: string): string | undefined {
  // Look for weidian links in the page
  const match = html.match(
    /https?:\/\/(?:www\.)?weidian\.com\/item\.html\?[^\s"'<>]+/
  );
  return match ? match[0] : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Extract seller from URL
    const sellerMatch = parsedUrl.hostname.match(/^([^.]+)\.x\.yupoo\.com$/);
    const sellerName = sellerMatch ? sellerMatch[1] : parsedUrl.hostname;
    const sellerUrl = sellerMatch
      ? `https://${sellerMatch[1]}.x.yupoo.com`
      : parsedUrl.origin;
    const albumsUrl = sellerMatch
      ? `https://${sellerMatch[1]}.x.yupoo.com/albums`
      : `${parsedUrl.origin}/albums`;

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: sellerUrl,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page (${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $(".showalbumheader__gallerytitle").text().trim() ||
      $(".album__title").text().trim() ||
      $(".album3__title").text().trim() ||
      $("title").text().trim() ||
      "";

    // Extract subtitle
    const subtitle =
      $(".showalbumheader__gallerysubtitle").text().trim() ||
      "";

    // Parse price from title + subtitle
    const price = parsePrice(title) || parsePrice(subtitle);

    // Extract images
    const images: string[] = [];
    const seenImages = new Set<string>();

    // Try various Yupoo image selectors
    $("img").each((_, el) => {
      const src =
        $(el).attr("data-origin-src") ||
        $(el).attr("data-src") ||
        $(el).attr("src") ||
        "";

      if (!src) return;

      // Normalize URL
      let imgUrl = src;
      if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;

      // Filter for actual product images
      if (
        imgUrl.includes("photo.yupoo.com") ||
        imgUrl.includes("yupoo.com/photo") ||
        imgUrl.includes("img.alicdn") ||
        (imgUrl.includes("yupoo") && /\.(jpg|jpeg|png|webp)/i.test(imgUrl))
      ) {
        // Upgrade to larger size
        imgUrl = imgUrl.replace(/\/small\//, "/big/");
        imgUrl = imgUrl.replace(/_\d+x\d+\./, ".");

        if (!seenImages.has(imgUrl)) {
          seenImages.add(imgUrl);
          images.push(imgUrl);
        }
      }
    });

    // Also check for images in links (sometimes in <a> tags)
    $("a[href*='photo.yupoo.com'], a[href*='yupoo.com/photo']").each(
      (_, el) => {
        const href = $(el).attr("href") || "";
        if (href && !seenImages.has(href)) {
          seenImages.add(href);
          images.push(href);
        }
      }
    );

    // Extract contact info from subtitle + page text
    const pageText = subtitle + " " + $("body").text().substring(0, 5000);
    const contact = extractContact(pageText);

    // Extract Weidian URL
    const weidianUrl = extractWeidianUrl(html);

    const result: ScrapeResult = {
      title,
      price_cny: price,
      images: images.slice(0, 30),
      seller_name: sellerName,
      seller_url: sellerUrl,
      albums_url: albumsUrl,
      subtitle: subtitle || undefined,
      weidian_url: weidianUrl,
      contact,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Scrape error:", message);
    return NextResponse.json(
      { error: `Scrape failed: ${message}` },
      { status: 500 }
    );
  }
}
