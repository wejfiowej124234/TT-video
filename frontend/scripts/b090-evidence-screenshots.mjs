/**
 * TT-7 (B-090): headless captures for verification pack.
 * Prereq: API on NEXT_PUBLIC_API_BASE_URL, Next dev on 127.0.0.1:3012.
 */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const outList = path.join(root, "docs", "verification-evidence", "screenshot-b090-proposals-list.png");
const outDetail = path.join(root, "docs", "verification-evidence", "screenshot-b090-proposal-detail.png");

const base = "http://127.0.0.1:3012";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(`${base}/governance/proposals`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: outList, fullPage: true });

await page.goto(`${base}/governance/proposals/1`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: outDetail, fullPage: true });

await browser.close();
console.log("wrote", outList, outDetail);
