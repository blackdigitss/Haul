import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
const frag = readFileSync("dist-artifact/haul-demo-artifact.html", "utf8");
const page_html = `<!doctype html><html><head><meta charset="utf-8"></head><body>${frag}</body></html>`;
const server = createServer((req, res) => { res.setHeader("Content-Type", "text/html"); res.end(page_html); });
await new Promise((r) => server.listen(4602, r));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/*", (route) =>
  route.request().url().startsWith("http://localhost:4602") ? route.continue() : route.abort()
);
await page.goto("http://localhost:4602/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: "screenshots/19-artifact-fragment.png" });
await browser.close();
server.close();
if (errors.length) { console.error("ERRORS:\n" + errors.join("\n")); process.exit(1); }
console.log("fragment renders inside host skeleton, zero JS errors");
