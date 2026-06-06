/**
 * `npm run e2e:community-post-detail-showcase` 入口：默认 **`PLAYWRIGHT_E2E_STABILITY=1`**
 *（`localhost:3012` · 端口回收 · `.next` purge — 见 **`run-e2e-default.mjs`**）。
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..");

if (!(process.env.PLAYWRIGHT_E2E_STABILITY ?? "").trim()) {
  process.env.PLAYWRIGHT_E2E_STABILITY = "1";
}

const passthrough = process.argv.slice(2);
const r = spawnSync(
  process.execPath,
  [
    "./scripts/run-e2e-default.mjs",
    "--project=chromium",
    "e2e/community-post-detail-showcase-local.spec.ts",
    ...passthrough,
  ],
  { cwd: frontendDir, stdio: "inherit", env: process.env },
);
process.exit(r.status === 0 ? 0 : typeof r.status === "number" ? r.status : 1);
