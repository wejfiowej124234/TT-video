/**
 * L4 Sepolia 主链 E2E 基线：`chromium-sepolia` project（排除 @e2e-chain-off-mock-pay、@e2e-sepolia-deferred）。
 *
 * 默认 PLAYWRIGHT_FULL_STACK=1、PLAYWRIGHT_EXPECT_CHAIN_ID=11155111；与 e2e:auth-chain 同源同步 .env.local。
 * 追加参数透传给 playwright，例如：`npm run e2e:sepolia -- e2e/smoke.spec.ts`
 *
 * **阶段二 · 并行效率（可选）**：
 * - **`PLAYWRIGHT_L4_FILE_PARALLEL=1`**：若未显式设 **`PLAYWRIGHT_WORKERS`**，则置为 **`4`**，在 **`fullyParallel: false`** 下提高 **跨 spec 文件**并行。争用高时可自设 **`PLAYWRIGHT_WORKERS=2`** 再跑 **193/0**。
 * - **`PLAYWRIGHT_L4_FULL_PARALLEL=1`**：置 **`PLAYWRIGHT_PARALLEL=1`**（及默认 **`PLAYWRIGHT_WORKERS=4`**），打开 **同文件内**并行；**flake 风险更高**，须全量 **`193/0`** 验证后再考虑 CI。
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..");
const repoRoot = path.join(frontendDir, "..");

if (process.env.PLAYWRIGHT_FULL_STACK == null || process.env.PLAYWRIGHT_FULL_STACK === "") {
  process.env.PLAYWRIGHT_FULL_STACK = "1";
}
if (process.env.PLAYWRIGHT_EXPECT_CHAIN_ID == null || process.env.PLAYWRIGHT_EXPECT_CHAIN_ID === "") {
  process.env.PLAYWRIGHT_EXPECT_CHAIN_ID = "11155111";
}

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
if (!process.env.PLAYWRIGHT_API_HEALTH_URL) {
  process.env.PLAYWRIGHT_API_HEALTH_URL = `http://127.0.0.1:${apiPort}/health`;
}

function syncFrontendEnvFromRoot() {
  try {
    if (process.platform === "win32") {
      execSync(
        `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev/sync-frontend-env-local-from-root.ps1 -ApiListenPort "${apiPort}"`,
        { cwd: repoRoot, stdio: "inherit" },
      );
    } else {
      execSync("bash scripts/dev/sync-frontend-env-local-from-root.sh", {
        cwd: repoRoot,
        stdio: "inherit",
        env: { ...process.env, API_LISTEN_PORT: apiPort },
      });
    }
  } catch (e) {
    console.warn("[e2e:sepolia] sync-frontend-env-local-from-root failed:", e?.message ?? e);
  }
}

function ensureFrontendEnvLocalApiBaseUrl() {
  const out = path.join(frontendDir, ".env.local");
  const desired = `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:${apiPort}`;
  const lines = existsSync(out) ? readFileSync(out, "utf8").split(/\r?\n/) : [];
  const ix = lines.findIndex((l) => l.trim().startsWith("NEXT_PUBLIC_API_BASE_URL="));
  if (ix >= 0) lines[ix] = desired;
  else {
    if (lines.length && lines[lines.length - 1] !== "") lines.push("");
    lines.push("# traveltrust e2e:sepolia", desired);
  }
  writeFileSync(out, lines.join("\n") + "\n", "utf8");
  console.log(`[e2e:sepolia] ${out} → ${desired}`);
}

function apiHealthOk() {
  try {
    execSync(`curl -sf http://127.0.0.1:${apiPort}/health`, {
      stdio: "ignore",
      env: process.env,
    });
    return true;
  } catch {
    return false;
  }
}

if (process.env.PLAYWRIGHT_FULL_STACK === "1") {
  syncFrontendEnvFromRoot();
  ensureFrontendEnvLocalApiBaseUrl();
}

if (process.env.PLAYWRIGHT_FULL_STACK === "1" && process.env.SKIP_API_BUILD !== "1") {
  if (apiHealthOk()) {
    console.log(`[e2e:sepolia] http://127.0.0.1:${apiPort}/health OK — skip cargo build`);
  } else {
    if (process.platform === "win32" && process.env.SKIP_API_TASKKILL !== "1") {
      try {
        execSync("taskkill /F /IM traveltrust-api.exe", {
          stdio: "ignore",
          windowsHide: true,
        });
      } catch {
        // no stray process
      }
    }
    console.log(
      "[e2e:sepolia] cargo build -p traveltrust-api (Playwright webServer runs target/debug binary)",
    );
    execSync("cargo build -p traveltrust-api", { cwd: repoRoot, stdio: "inherit", env: process.env });
  }
}

if (process.env.PLAYWRIGHT_L4_FILE_PARALLEL === "1") {
  const w = process.env.PLAYWRIGHT_WORKERS?.trim();
  if (!w) {
    process.env.PLAYWRIGHT_WORKERS = "4";
    console.log("[e2e:sepolia] PLAYWRIGHT_L4_FILE_PARALLEL=1 → PLAYWRIGHT_WORKERS=4 (跨文件并行)");
  }
}
if (process.env.PLAYWRIGHT_L4_FULL_PARALLEL === "1") {
  if (process.env.PLAYWRIGHT_PARALLEL !== "1") {
    process.env.PLAYWRIGHT_PARALLEL = "1";
    console.log("[e2e:sepolia] PLAYWRIGHT_L4_FULL_PARALLEL=1 → PLAYWRIGHT_PARALLEL=1");
  }
  const w = process.env.PLAYWRIGHT_WORKERS?.trim();
  if (!w) {
    process.env.PLAYWRIGHT_WORKERS = "4";
    console.log("[e2e:sepolia] PLAYWRIGHT_L4_FULL_PARALLEL=1 → PLAYWRIGHT_WORKERS=4");
  }
}

const extra = process.argv.slice(2).join(" ");
const cmd = `npx playwright test --project=chromium-sepolia${extra ? ` ${extra}` : ""}`;
try {
  execSync(cmd, { cwd: frontendDir, stdio: "inherit", env: process.env });
} catch (e) {
  const st =
    e && typeof e === "object" && "status" in e && typeof e.status === "number" ? e.status : 1;
  process.exit(st);
}
