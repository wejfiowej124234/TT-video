/**
 * 本地「直连 API」烟测：**F-029 / F-030 / F-031**（`f029-f030-f031-request.spec.ts`）。
 *
 * 用法：`npm run e2e:api-f029-f030-f031-local`（cwd **frontend**；须 **`DATABASE_URL`**；**`P3_CHAIN_OFF=1`**）。
 * 根 `.env` 含 **`INTERNAL_API_SECRET`** 时，本脚本会注入 **`PLAYWRIGHT_INTERNAL_API_SECRET`**（与 **`npm run e2e`** 同源 **`e2e-align-env-from-root.mjs`**）。
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { alignPlaywrightProcessEnvFromRootDotenv } from "./e2e-align-env-from-root.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..");
const repoRoot = path.join(frontendDir, "..");

alignPlaywrightProcessEnvFromRootDotenv(repoRoot);

process.env.PLAYWRIGHT_FULL_STACK = "0";
process.env.PLAYWRIGHT_API_ONLY = "1";
if ((process.env.PLAYWRIGHT_RELAX_META_CHAIN_GUARD ?? "").trim() === "") {
  process.env.PLAYWRIGHT_RELAX_META_CHAIN_GUARD = "1";
}
process.env.CHAIN_RPC_URL = "";
if ((process.env.P3_CHAIN_OFF ?? "").trim() === "") {
  process.env.P3_CHAIN_OFF = "1";
}
if (process.platform === "win32" && (process.env.PLAYWRIGHT_API_START_MODE ?? "").trim() === "") {
  process.env.PLAYWRIGHT_API_START_MODE = "binary";
}

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
if (!process.env.PLAYWRIGHT_API_BASE_URL) {
  process.env.PLAYWRIGHT_API_BASE_URL = `http://127.0.0.1:${apiPort}`;
}

if (process.env.SKIP_API_BUILD !== "1") {
  try {
    execSync(`curl -sf --max-time 2 http://127.0.0.1:${apiPort}/health`, {
      stdio: "ignore",
      env: process.env,
    });
  } catch {
    console.log("[e2e:api-f029-f030-f031-local] cargo build -p traveltrust-api");
    execSync("cargo build -p traveltrust-api", { cwd: repoRoot, stdio: "inherit", env: process.env });
  }
}

const cmd =
  "npx playwright test e2e/f029-f030-f031-request.spec.ts --project=api-f029-f030-f031-chromium";
try {
  execSync(cmd, { cwd: frontendDir, stdio: "inherit", env: process.env });
} catch (e) {
  const st =
    e && typeof e === "object" && "status" in e && typeof e.status === "number" ? e.status : 1;
  process.exit(st);
}
