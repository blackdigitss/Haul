// Demo-mode smoke test + screenshots: drives every page of the built app.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:4173";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(
  process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : {}
);
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("net::") && !m.text().includes("Failed to load resource"))
    errors.push(`console: ${m.text()}`);
});

async function shot(path, name, actions) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  if (actions) await actions();
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`ok ${name}`);
}

await shot("/login", "01-login");
await shot("/?demo=1", "02-home");
await shot("/items", "03-items");
await page.goto(`${BASE}/items`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.locator("a[href^='/items/']").first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/04-item-detail.png` });
console.log("ok 04-item-detail");
await shot("/sellers", "05-sellers");
await page.locator("a[href^='/sellers/']").first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/06-seller-vetting.png` });
console.log("ok 06-seller-vetting");
await shot("/hauls", "07-hauls");
await page.locator("a[href^='/hauls/']").first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/08-haul-detail.png` });
console.log("ok 08-haul-detail");
await shot("/radar", "09-radar", async () => {
  await page.fill("input", "W2C chrome hearts");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500);
});
await shot("/insights", "10-insights");
await shot("/settings", "11-settings");
await page.goto(`${BASE}/?demo=1`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.locator("button[aria-label='Open Haul AI']").click();
await page.waitForTimeout(400);
await page.locator("text=What should I cop next?").click();
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/12-ai-chat.png` });
console.log("ok 12-ai-chat");
await page.goto(`${BASE}/items`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.getByRole("button", { name: /Add/ }).first().click();
await page.waitForTimeout(400);
await page.fill("input[placeholder*='Yupoo']", "https://topfashion7.x.yupoo.com/albums/123456");
await page.getByRole("button", { name: "Fetch" }).click();
await page.waitForTimeout(1600);
await page.screenshot({ path: `${OUT}/13-add-item-scrape.png` });
console.log("ok 13-add-item-scrape");

await browser.close();
if (errors.length) {
  console.error("\nJS ERRORS:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("\nAll pages loaded with zero JS errors.");
