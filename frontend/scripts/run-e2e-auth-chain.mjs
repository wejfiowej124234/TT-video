/**
 * 一键跑通：注册 → 登录 → /market（Network 断言）+ 可选 PostgreSQL 会话对齐。
 *
 * 默认设 PLAYWRIGHT_FULL_STACK=1：Playwright 并行拉起 traveltrust-api（:8080）与 Next（默认 :3050，见脚本内 PLAYWRIGHT_BASE_URL）。
 * 数据库会话校验（根目录 .env 中 DATABASE_URL；本机 `psql` 或 `docker exec traveltrust-postgres psql`）：
 *   PLAYWRIGHT_VERIFY_PG=1 node scripts/run-e2e-auth-chain.mjs
 *
 * 仅 Unix：可先 `docker compose up -d` 再运行；Windows 请先 `docker compose up -d` 后执行本脚本。
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

/** 专用端口，避免复用已在 3012 上跑的旧 Next（未加载新写入的 NEXT_PUBLIC_API_BASE_URL）。 */
if (!process.env.PLAYWRIGHT_BASE_URL) {
  process.env.PLAYWRIGHT_BASE_URL = `http://127.0.0.1:${process.env.PLAYWRIGHT_FE_PORT ?? "3050"}`;
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
    console.warn("[e2e:auth-chain] sync-frontend-env-local-from-root failed:", e?.message ?? e);
  }
}

/** 强制浏览器侧 API 基址指向本机 traveltrust-api（避免 Next 端口误配 → HTML 当 JSON）。 */
function ensureFrontendEnvLocalApiBaseUrl() {
  const out = path.join(frontendDir, ".env.local");
  const desired = `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:${apiPort}`;
  const lines = existsSync(out) ? readFileSync(out, "utf8").split(/\r?\n/) : [];
  const ix = lines.findIndex((l) => l.trim().startsWith("NEXT_PUBLIC_API_BASE_URL="));
  if (ix >= 0) lines[ix] = desired;
  else {
    if (lines.length && lines[lines.length - 1] !== "") lines.push("");
    lines.push("# traveltrust e2e:auth-chain", desired);
  }
  writeFileSync(out, lines.join("\n") + "\n", "utf8");
  console.log(`[e2e:auth-chain] ${out} → ${desired}`);
}

function loadDatabaseUrlFromRootEnv() {
  if (process.env.DATABASE_URL?.trim()) return;
  const p = path.join(repoRoot, ".env");
  if (!existsSync(p)) return;
  const txt = readFileSync(p, "utf8");
  for (const line of txt.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^DATABASE_URL=(.+)$/);
    if (m) {
      process.env.DATABASE_URL = m[1].trim().replace(/^["']|["']$/g, "");
      break;
    }
  }
}

if (process.env.PLAYWRIGHT_VERIFY_PG === "1") {
  loadDatabaseUrlFromRootEnv();
}

if (process.env.PLAYWRIGHT_FULL_STACK === "1") {
  syncFrontendEnvFromRoot();
  ensureFrontendEnvLocalApiBaseUrl();
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

if (process.env.PLAYWRIGHT_FULL_STACK === "1" && process.env.SKIP_API_BUILD !== "1") {
  if (apiHealthOk()) {
    console.log(`[e2e:auth-chain] http://127.0.0.1:${apiPort}/health OK — skip cargo build`);
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
      "[e2e:auth-chain] cargo build -p traveltrust-api (Playwright webServer runs target/debug binary to reduce link races)",
    );
    execSync("cargo build -p traveltrust-api", { cwd: repoRoot, stdio: "inherit", env: process.env });
  }
}

const extra = process.argv.slice(2).join(" ");
const cmd = `npx playwright test e2e/auth-register-login-market-chain.spec.ts --project=chromium${extra ? ` ${extra}` : ""}`;
try {
  execSync(cmd, { cwd: frontendDir, stdio: "inherit", env: process.env });
} catch (e) {
  const st =
    e && typeof e === "object" && "status" in e && typeof e.status === "number" ? e.status : 1;
  process.exit(st);
}
