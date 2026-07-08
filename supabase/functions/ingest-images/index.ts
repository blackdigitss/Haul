// Permanently rehosts an item's scraped images: fetches with a spoofed
// Referer, uploads originals to product-images and 320px WebP thumbnails to
// product-thumbs, then writes the public URLs onto the product row.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode, Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const { productId, imageUrls, sellerSubdomain } = await req.json();
    if (!productId || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return jsonResponse({ error: "Missing productId or imageUrls" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const referer = sellerSubdomain
      ? `https://${sellerSubdomain}.x.yupoo.com/`
      : "https://weidian.com/";

    const fullUrls: string[] = [];
    const thumbUrls: string[] = [];
    const errors: string[] = [];
    const MAX = 20;

    for (let i = 0; i < Math.min(imageUrls.length, MAX); i++) {
      const src = imageUrls[i];
      try {
        const res = await fetch(src, {
          headers: { Referer: referer, "User-Agent": UA },
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) {
          errors.push(`fetch ${i}: ${res.status}`);
          continue;
        }
        const buf = new Uint8Array(await res.arrayBuffer());

        const ext = res.headers.get("content-type")?.includes("png") ? "png" : "jpg";
        const fullPath = `${userId}/${productId}/${i}.${ext}`;
        const thumbPath = `${userId}/${productId}/${i}.webp`;

        const { error: upErr } = await admin.storage
          .from("product-images")
          .upload(fullPath, buf, {
            contentType: res.headers.get("content-type") || "image/jpeg",
            upsert: true,
          });
        if (upErr) {
          errors.push(`up ${i}: ${upErr.message}`);
          continue;
        }
        const { data: pub1 } = admin.storage.from("product-images").getPublicUrl(fullPath);
        fullUrls.push(pub1.publicUrl);

        try {
          const img = (await decode(buf)) as Image;
          const ratio = img.width / img.height;
          const tw = ratio >= 1 ? 320 : Math.round(320 * ratio);
          const th = ratio >= 1 ? Math.round(320 / ratio) : 320;
          img.resize(tw, th);
          const webp = await img.encode(85);
          const { error: tErr } = await admin.storage
            .from("product-thumbs")
            .upload(thumbPath, webp, { contentType: "image/webp", upsert: true });
          if (!tErr) {
            const { data: pub2 } = admin.storage.from("product-thumbs").getPublicUrl(thumbPath);
            thumbUrls.push(pub2.publicUrl);
          } else {
            thumbUrls.push(pub1.publicUrl);
          }
        } catch {
          thumbUrls.push(pub1.publicUrl);
        }
      } catch (e) {
        errors.push(`${i}: ${String(e)}`);
      }
    }

    const { error: updErr } = await admin
      .from("products")
      .update({ image_urls: fullUrls, thumb_urls: thumbUrls })
      .eq("id", productId)
      .eq("user_id", userId);
    if (updErr) return jsonResponse({ error: updErr.message, errors }, 500);

    return jsonResponse({ success: true, count: fullUrls.length, errors });
  } catch (error) {
    console.error("Ingest error:", error);
    return jsonResponse({ error: String(error) }, 500);
  }
});
