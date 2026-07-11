import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const html = readFileSync("dist-artifact/index.html");
const server = createServer((req, res) => {
  res.setHeader("Content-Type", "text/html");
  // simulate the artifact CSP: page served, no other assets exist
  res.end(html);
});
await new Promise((r) => server.listen(4599, r));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// block all external requests to simulate artifact CSP
await page.route("**/*", (route) => {
  const url = route.request().url();
  if (url.startsWith("http://localhost:4599")) return route.continue();
  return route.abort();
});
await page.goto("http://localhost:4599/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: "screenshots/16-artifact-home.png" });
await page.goto("http://localhost:4599/#/items", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.screenshot({ path: "screenshots/17-artifact-items.png" });
await page.goto("http://localhost:4599/#/hauls", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.locator("a[href*='/hauls/']").first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: "screenshots/18-artifact-haul.png" });
await browser.close();
server.close();
if (errors.length) {
  console.error("ERRORS:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("single-file build works offline, zero JS errors");
