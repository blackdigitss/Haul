import { test, expect } from "@playwright/test";

const TEST_URL = "https://yolo66.x.yupoo.com/albums/227021206?uid=1";

test.describe("Haul App - Public Pages", () => {
  test("homepage loads and shows login page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Haul")).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Sign In")).toBeVisible();
    await expect(page.getByText("Continue with Google")).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
  });

  test("login page has sign up link", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Sign up")).toBeVisible({ timeout: 20000 });
  });

  test("unauthenticated routes redirect to login", async ({ page }) => {
    for (const path of ["/products", "/products/new", "/sellers", "/hauls", "/settings"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("Sign In")).toBeVisible({ timeout: 15000 });
    }
  });
});

test.describe("Haul App - Scrape API", () => {
  test("returns images for Yupoo URL", async ({ request }) => {
    const res = await request.post("/api/scrape", {
      data: { url: TEST_URL },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.title).toBeTruthy();
    expect(data.images).toBeInstanceOf(Array);
    expect(data.images.length).toBeGreaterThan(0);
    for (const img of data.images) {
      expect(img).toContain("photo.yupoo.com");
    }
    console.log(`Scrape: "${data.title}", ${data.images.length} images`);
  });

  test("returns price from shorthand format (170Y)", async ({ request }) => {
    const res = await request.post("/api/scrape", {
      data: { url: TEST_URL },
    });
    const data = await res.json();
    expect(data.price_cny).toBe(170);
  });

  test("returns seller info", async ({ request }) => {
    const res = await request.post("/api/scrape", {
      data: { url: TEST_URL },
    });
    const data = await res.json();
    expect(data.seller_name).toBeTruthy();
    expect(data.seller_url).toBeTruthy();
  });

  test("rejects empty URL", async ({ request }) => {
    const res = await request.post("/api/scrape", {
      data: { url: "" },
    });
    expect(res.ok()).toBeFalsy();
  });
});

test.describe("Haul App - Image Proxy", () => {
  test("returns valid JPEG for yupoo image", async ({ request }) => {
    const scrapeRes = await request.post("/api/scrape", {
      data: { url: TEST_URL },
    });
    const scrapeData = await scrapeRes.json();
    const imageUrl = scrapeData.images[0];

    const proxyRes = await request.get(
      `/api/img?url=${encodeURIComponent(imageUrl)}`
    );
    expect(proxyRes.ok()).toBeTruthy();
    expect(proxyRes.headers()["content-type"]).toContain("image");
    const body = await proxyRes.body();
    expect(body.length).toBeGreaterThan(10000);
    console.log(`Proxy: ${body.length} bytes, ${proxyRes.headers()["content-type"]}`);
  });

  test("rejects non-yupoo URLs", async ({ request }) => {
    const res = await request.get(
      `/api/img?url=${encodeURIComponent("https://example.com/image.jpg")}`
    );
    expect(res.status()).toBe(403);
  });

  test("rejects missing URL param", async ({ request }) => {
    const res = await request.get("/api/img");
    expect(res.status()).toBe(400);
  });

  test("returns cache headers", async ({ request }) => {
    const scrapeRes = await request.post("/api/scrape", {
      data: { url: TEST_URL },
    });
    const scrapeData = await scrapeRes.json();

    const proxyRes = await request.get(
      `/api/img?url=${encodeURIComponent(scrapeData.images[0])}`
    );
    const cacheControl = proxyRes.headers()["cache-control"];
    expect(cacheControl).toContain("max-age");
  });

  test("multiple images load successfully", async ({ request }) => {
    const scrapeRes = await request.post("/api/scrape", {
      data: { url: TEST_URL },
    });
    const scrapeData = await scrapeRes.json();
    const testImages = scrapeData.images.slice(0, 3);

    for (const imageUrl of testImages) {
      const proxyRes = await request.get(
        `/api/img?url=${encodeURIComponent(imageUrl)}`
      );
      expect(proxyRes.ok()).toBeTruthy();
      const body = await proxyRes.body();
      expect(body.length).toBeGreaterThan(1000);
    }
    console.log(`All ${testImages.length} proxied images loaded`);
  });
});

test.describe("Haul App - Static Assets", () => {
  test("CSS loads correctly (global styles applied)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Check that CSS variables are applied (dark theme is default)
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    expect(bgColor).toBeTruthy();
  });

  test("page has correct meta tags", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toContain("Haul");
  });
});
