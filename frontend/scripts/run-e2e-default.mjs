/**
 * `npm run e2e` 入口。
 *
 * - **本地**（未识别为 CI）：若未显式设置 `PLAYWRIGHT_FULL_STACK`，默认 **`PLAYWRIGHT_FULL_STACK=1`**，
 *   由 `playwright.config.ts` 并行起 **`traveltrust-api`**（`:8080`）与 Next，避免仅起 Next 时出现 **`ECONNREFUSED 127.0.0.1:8080`**。
 * - **CI**（`CI` / `GITHUB_ACTIONS` 为真）：**不**改 `PLAYWRIGHT_FULL_STACK`；**`build.yml`** 已手工后台起 API，与仅由 Playwright 起 **`npm run start`** 的分工一致。
 * - 显式 **`PLAYWRIGHT_FULL_STACK=0`**：尊重仅前端 / 契约烟测场景。
 *
 * 参数透传：`npm run e2e -- --project=chromium`、`npm run e2e -- e2e/smoke.spec.ts` 等。
 *
 * **进程环境**：见 **`./e2e-align-env-from-root.mjs`**（根 `.env` 的 **`INTERNAL_API_SECRET`**、默认 **`P3_*`** / **`PLAYWRIGHT_ARBITRATOR_SEED_EMAIL`**），与 **`run-e2e-api-*`** 同源。
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { alignPlaywrightProcessEnvFromRootDotenv } from "./e2e-align-env-from-root.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..");
const repoRoot = path.join(frontendDir, "..");

function inCi() {
  const c = process.env.CI?.trim().toLowerCase();
  const g = process.env.GITHUB_ACTIONS?.trim().toLowerCase();
  return c === "true" || c === "1" || g === "true" || g === "1";
}

if (!inCi() && (process.env.PLAYWRIGHT_FULL_STACK ?? "") === "") {
  process.env.PLAYWRIGHT_FULL_STACK = "1";
  console.log("[e2e] local default → PLAYWRIGHT_FULL_STACK=1 (API + Next via playwright webServer)");
}

if (process.env.PLAYWRIGHT_FULL_STACK === "1" && !(process.env.REQUEST_TIMEOUT_SECS ?? "").trim()) {
  process.env.REQUEST_TIMEOUT_SECS = "120";
  console.log("[e2e] REQUEST_TIMEOUT_SECS → 120 (GET /meta governance eth_call stack; avoid 408)");
}

alignPlaywrightProcessEnvFromRootDotenv(repoRoot);

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const stabilityE2e = process.env.PLAYWRIGHT_E2E_STABILITY === "1";
/** `/community/me` 窄绿集后续 Playwright 步：复用首步已暖 Next/API，勿 purge `.next` / reclaim 端口 */
const communityMeGreenReuse = process.env.COMMUNITY_ME_L5_GREEN_REUSE === "1";
if (!process.env.PLAYWRIGHT_API_HEALTH_URL) {
  process.env.PLAYWRIGHT_API_HEALTH_URL = `http://127.0.0.1:${apiPort}/health`;
}
/**
 * 稳定性路径须与 Next dev 默认 hostname（localhost）一致：用 `127.0.0.1` 打开页面时 Next 15+ 会拦截 `/_next/*`，
 * 导致 hydration/脚本异常；`localhost` + `localhost` API 仍同站，Cookie/Bearer 与 STRICT_SESSION 兼容。
 */
if (stabilityE2e && !(process.env.PLAYWRIGHT_BASE_URL ?? "").trim()) {
  process.env.PLAYWRIGHT_BASE_URL = "http://localhost:3012";
  console.log("[e2e-stability] PLAYWRIGHT_BASE_URL → http://localhost:3012 (avoid Next dev /_next cross-host block)");
}

function feListenPort() {
  const u = process.env.PLAYWRIGHT_BASE_URL?.trim();
  if (!u) return "3012";
  try {
    const p = new URL(u).port;
    return p || "3012";
  } catch {
    const m = u.match(/:(\d+)/);
    return m ? m[1] : "3012";
  }
}

/** Free Next listen port so Playwright webServer 不因陈旧 node 占 3012 而连错进程。 */
function reclaimFrontendListenPort() {
  const port = feListenPort();
  if (process.platform === "win32") {
    try {
      execSync(
        `powershell -NoProfile -Command ` +
          `"$p = @(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | ` +
          `Select-Object -ExpandProperty OwningProcess -Unique); ` +
          `foreach ($x in $p) { if ($x -and $x -ne 0) { Stop-Process -Id $x -Force -ErrorAction SilentlyContinue } }"`,
        { stdio: "ignore", windowsHide: true },
      );
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    execSync(
      `bash -lc 'pids=$(lsof -t -iTCP:${port} -sTCP:LISTEN 2>/dev/null || true); if [ -n "$pids" ]; then kill -9 $pids 2>/dev/null || true; fi'`,
      { stdio: "ignore", env: process.env },
    );
  } catch {
    /* ignore */
  }
}

function printStabilityEnvSummary() {
  const db = process.env.DATABASE_URL?.trim();
  if (!db) {
    console.error("[e2e-stability] PLAYWRIGHT_E2E_STABILITY=1 requires DATABASE_URL");
    process.exit(1);
  }
  const redacted = db.replace(/:([^:@/]*)@/, ":****@");
  console.log("[e2e-stability] DATABASE_URL:", redacted);
  console.log(
    "[e2e-stability] API_RATE_LIMIT_PER_MINUTE:",
    process.env.API_RATE_LIMIT_PER_MINUTE ?? "(unset; playwright injects 0)",
  );
  console.log(
    "[e2e-stability] CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:",
    process.env.CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE ?? "(unset; playwright injects 0)",
  );
  console.log(
    "[e2e-stability] login rate buckets: AUTH_LOGIN_* / AUTH_*_POST_* → 0 via playwright apiServer.env when stability",
  );
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
    console.warn("[e2e] sync-frontend-env-local-from-root failed:", e?.message ?? e);
  }
}

function ensureFrontendEnvLocalApiBaseUrl() {
  const out = path.join(frontendDir, ".env.local");
  const lines = existsSync(out) ? readFileSync(out, "utf8").split(/\r?\n/) : [];
  const banner = "# traveltrust npm run e2e (run-e2e-default.mjs)";
  const upsert = (key, value) => {
    const desired = `${key}=${value}`;
    const ix = lines.findIndex((l) => l.trim().startsWith(`${key}=`));
    if (ix >= 0) lines[ix] = desired;
    else {
      if (lines.length && lines[lines.length - 1] !== "") lines.push("");
      if (!lines.some((l) => l.trim() === banner)) lines.push(banner);
      lines.push(desired);
    }
  };
  upsert(
    "NEXT_PUBLIC_API_BASE_URL",
    stabilityE2e ? `http://localhost:${apiPort}` : `http://127.0.0.1:${apiPort}`,
  );
  if (stabilityE2e) {
    upsert("NEXT_PUBLIC_SKIP_ME_FETCH", "0");
  }
  writeFileSync(out, lines.join("\n") + "\n", "utf8");
  const apiHost = stabilityE2e ? "localhost" : "127.0.0.1";
  console.log(
    `[e2e] ${out} → NEXT_PUBLIC_API_BASE_URL=http://${apiHost}:${apiPort}` +
      (stabilityE2e ? " + NEXT_PUBLIC_SKIP_ME_FETCH=0" : ""),
  );
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

/** 复用 :8080 时预热 `/meta`，降低 setup-meta-chain 首击 408；失败则返回 false 以触发换进程 */
function apiMetaWarmOk() {
  const metaUrl = `http://127.0.0.1:${apiPort}/meta`;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      execSync(`curl -sf -m 120 "${metaUrl}" -o /dev/null`, {
        stdio: "ignore",
        env: process.env,
      });
      console.log(`[e2e] ${metaUrl} warmup OK`);
      return true;
    } catch {
      if (attempt < 4) {
        console.log(`[e2e] ${metaUrl} warmup attempt ${attempt}/4 — retry in 3s`);
        try {
          execSync("sleep 3", { stdio: "ignore", env: process.env });
        } catch {
          /* Windows Git Bash has sleep */
        }
      }
    }
  }
  console.warn(`[e2e] ${metaUrl} warmup failed after 4 attempts`);
  return false;
}

/** Free Playwright API port so a new process can inherit current env (e.g. DATABASE_URL from local gate). */
function killStrayApiOnPlaywrightPort() {
  if (process.platform === "win32" && process.env.SKIP_API_TASKKILL !== "1") {
    try {
      execSync("taskkill /F /IM traveltrust-api.exe", {
        stdio: "ignore",
        windowsHide: true,
      });
    } catch {
      // no stray process
    }
    return;
  }
  try {
    execSync(
      `bash -lc 'pids=$(lsof -t -iTCP:${apiPort} -sTCP:LISTEN 2>/dev/null || true); if [ -n "$pids" ]; then kill -9 $pids 2>/dev/null || true; fi'`,
      { stdio: "ignore", env: process.env },
    );
  } catch {
    // lsof missing or nothing listening
  }
}

if (process.env.PLAYWRIGHT_FULL_STACK === "1") {
  syncFrontendEnvFromRoot();
  ensureFrontendEnvLocalApiBaseUrl();
}

if (process.env.PLAYWRIGHT_FULL_STACK === "1" && stabilityE2e) {
  printStabilityEnvSummary();
}

if (stabilityE2e && !inCi()) {
  const mem = "--max-old-space-size=8192";
  process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS?.trim(), mem].filter(Boolean).join(" ");
  if (!(process.env.PLAYWRIGHT_WORKERS ?? "").trim()) {
    process.env.PLAYWRIGHT_WORKERS = "1";
  }
  if (!(process.env.PLAYWRIGHT_PARALLEL ?? "").trim()) {
    process.env.PLAYWRIGHT_PARALLEL = "0";
  }
}

// Gate 在 shell 导出；仅起 webServer 时 Playwright 进程可能未继承 → setup-meta-chain 仍走严格 /meta，易触 Axum 30s → HTTP 408。
if (stabilityE2e && !(process.env.PLAYWRIGHT_RELAX_META_CHAIN_GUARD ?? "").trim()) {
  process.env.PLAYWRIGHT_RELAX_META_CHAIN_GUARD = "1";
  console.log(
    "[e2e-stability] PLAYWRIGHT_RELAX_META_CHAIN_GUARD → 1 (setup-meta-chain + API /meta relaxed branch; match run-production-gate-local.sh)",
  );
}

if (process.env.PLAYWRIGHT_FULL_STACK === "1" && process.env.SKIP_API_BUILD !== "1") {
  const gateFresh = process.env.TRAVELTRUST_GATE_ENSURE_FRESH_API === "1";
  const needReclaim = gateFresh || stabilityE2e;
  let healthy = apiHealthOk();
  if (healthy && !gateFresh && !stabilityE2e) {
    if (!apiMetaWarmOk()) {
      console.log(
        "[e2e] reused API /meta not ready — reclaim port and rebuild (inherits REQUEST_TIMEOUT_SECS)",
      );
      healthy = false;
    } else {
      console.log(`[e2e] http://127.0.0.1:${apiPort}/health OK — skip cargo build`);
    }
  }
  const stabilityFresh = stabilityE2e && !communityMeGreenReuse;
  if (!healthy || gateFresh || stabilityFresh) {
    if (gateFresh) {
      console.log(
        "[e2e] TRAVELTRUST_GATE_ENSURE_FRESH_API=1 — reclaim port / rebuild so API inherits current env",
      );
    }
    if (stabilityFresh && !gateFresh) {
      console.log(
        "[e2e] PLAYWRIGHT_E2E_STABILITY=1 — reclaim FE/API ports + rebuild so webServer children see DATABASE_URL + rate-limit-off",
      );
    }
    if (communityMeGreenReuse && healthy && !gateFresh) {
      console.log("[e2e] COMMUNITY_ME_L5_GREEN_REUSE=1 — reuse warm FE/API from prior green step");
    }
    if (needReclaim && !communityMeGreenReuse) reclaimFrontendListenPort();
    if (!communityMeGreenReuse) killStrayApiOnPlaywrightPort();
    console.log("[e2e] cargo build -p traveltrust-api (Playwright webServer runs target/debug binary)");
    execSync("cargo build -p traveltrust-api", { cwd: repoRoot, stdio: "inherit", env: process.env });
  }
}

/** Windows 稳定性：陈旧 `.next` 易使浏览器仍跑旧 client chunk（注册页 `postRegister`/跳转逻辑与源码脱节）。设 `PLAYWRIGHT_SKIP_NEXT_PURGE=1` 可跳过（加快迭代）。 */
if (stabilityE2e && !inCi() && process.env.PLAYWRIGHT_SKIP_NEXT_PURGE !== "1" && !communityMeGreenReuse) {
  const nextDir = path.join(frontendDir, ".next");
  if (existsSync(nextDir)) {
    try {
      rmSync(nextDir, { recursive: true, force: true });
      console.log("[e2e-stability] removed frontend/.next so Next dev rebuilds client bundles (stale chunk / A-REG-001 flakiness)");
    } catch (e) {
      console.warn("[e2e-stability] could not remove frontend/.next:", e);
    }
  }
}

const extra = process.argv.slice(2).join(" ");
const cmd = `npx playwright test${extra ? ` ${extra}` : ""}`;
try {
  execSync(cmd, { cwd: frontendDir, stdio: "inherit", env: process.env });
} catch (e) {
  const st =
    e && typeof e === "object" && "status" in e && typeof e.status === "number" ? e.status : 1;
  process.exit(st);
}
