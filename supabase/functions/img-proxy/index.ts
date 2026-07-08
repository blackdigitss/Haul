// Streams hotlink-protected marketplace images with a spoofed Referer so the
// app can display Yupoo/Weidian photos. Restricted to known image hosts so
// this can't be abused as an open proxy.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const ALLOWED_HOSTS = [
  "yupoo.com",
  "weidian.com",
  "wdcdn.net",
  "alicdn.com",
  "redd.it",
  "redditmedia.com",
];

function hostAllowed(hostname: string): boolean {
  return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");
    if (!imageUrl) return jsonResponse({ error: "Missing url parameter" }, 400);

    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      return jsonResponse({ error: "Invalid url" }, 400);
    }
    if (!hostAllowed(parsed.hostname)) {
      return jsonResponse({ error: "Host not allowed" }, 403);
    }

    // Spoof the referer as the page the image legitimately lives on.
    let referer = "https://www.yupoo.com/";
    if (parsed.hostname.includes("yupoo.com")) {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) referer = `https://${pathParts[0]}.x.yupoo.com/`;
    } else if (
      parsed.hostname.includes("weidian") ||
      parsed.hostname.includes("wdcdn")
    ) {
      referer = "https://weidian.com/";
    } else if (parsed.hostname.includes("alicdn")) {
      referer = "https://www.taobao.com/";
    } else {
      referer = `https://${parsed.hostname}/`;
    }

    const response = await fetch(imageUrl, {
      headers: {
        Referer: referer,
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return jsonResponse({ error: `Upstream returned ${response.status}` }, response.status);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    return new Response(response.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return jsonResponse({ error: "Failed to fetch image" }, 500);
  }
});
