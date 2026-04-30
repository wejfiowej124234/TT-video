/**
 * 本地复跑 **96-17** 顶栏身份脊签 E2E（**不经** **`setup-meta-chain`**）。
 *
 * 须 **API + Next**（与 **`chromium`** 全栈同源）；**`PLAYWRIGHT_FULL_STACK=1`**，**勿** **`PLAYWRIGHT_API_ONLY=1`**。
 *
 * 用法（cwd 为 **frontend**）：
 *   `npm run e2e:96-17-identity-local`
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { alignPlaywrightProcessEnvFromRootDotenv } from "./e2e-align-env-from-root.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..");
const repoRoot = path.join(frontendDir, "..");

alignPlaywrightProcessEnvFromRootDotenv(repoRoot);

process.env.PLAYWRIGHT_FULL_STACK = "1";
delete process.env.PLAYWRIGHT_API_ONLY;

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
    console.log("[e2e:96-17-identity-local] cargo build -p traveltrust-api");
    execSync("cargo build -p traveltrust-api", { cwd: repoRoot, stdio: "inherit", env: process.env });
  }
}

const cmd =
  "npx playwright test e2e/96-17-header-identity-spine.spec.ts --project=chromium-96-17-identity";
try {
  execSync(cmd, { cwd: frontendDir, stdio: "inherit", env: process.env });
} catch (e) {
  const st =
    e && typeof e === "object" && "status" in e && typeof e.status === "number" ? e.status : 1;
  process.exit(st);
}
