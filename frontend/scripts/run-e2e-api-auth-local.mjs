/**
 * 本地「直连 API」Auth / Me 烟测：只起 **traveltrust-api**（不经 Next），避免 **`PLAYWRIGHT_FULL_STACK=0`**
 * 仍拉起 **Next dev** 导致 Webpack 冷启动观感卡死。
 *
 * 前置：`DATABASE_URL` 可达 Postgres；建议先 **`cargo build -p traveltrust-api`**（Windows 上 binary 模式避免 `cargo run` 抢 exe）。
 *
 * 用法（仓库根或 frontend 均可）：
 *   `npm run e2e:api-auth-local`（cwd 为 frontend；**`--project=api-auth-chromium`**，不经 **`setup-meta-chain`**）
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
    console.log("[e2e:api-auth-local] cargo build -p traveltrust-api");
    execSync("cargo build -p traveltrust-api", { cwd: repoRoot, stdio: "inherit", env: process.env });
  }
}

const cmd =
  "npx playwright test e2e/auth-login-logout-me.spec.ts --project=api-auth-chromium";
try {
  execSync(cmd, { cwd: frontendDir, stdio: "inherit", env: process.env });
} catch (e) {
  const st =
    e && typeof e === "object" && "status" in e && typeof e.status === "number" ? e.status : 1;
  process.exit(st);
}
