/**
 * Playwright 入口共享：从仓库根 `.env` 补齐本进程环境，使 **`request` 夹头** 与 **API 子进程**（dotenvy 读 `.env`）一致。
 *
 * - **INTERNAL_API_SECRET**：API 子进程有密钥而 Node 未设时，`GET /api/v1/internal/*` 会 **403**（**F-029**）。
 * - **P3_SEED_ARBITRATOR_EMAIL / PLAYWRIGHT_ARBITRATOR_SEED_EMAIL**：未设时落到 CI 专用 seed（**F-025** / **B-DSP-003**）。
 * - **DATABASE_URL**：未设时从根 **`.env`** 解析（**`PLAYWRIGHT_E2E_STABILITY=1`** 与 gate 一致）。
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const E2E_CI_ARBITRATOR_EMAIL = "e2e-ci-arbitrator-seed@traveltrust.test";

/**
 * @param {string} repoRoot 仓库根（含 `.env`）
 */
export function alignInternalApiSecretFromRootDotenv(repoRoot) {
  if ((process.env.INTERNAL_API_SECRET ?? "").trim()) return;
  const dotenvPath = path.join(repoRoot, ".env");
  if (!existsSync(dotenvPath)) return;
  const lines = readFileSync(dotenvPath, "utf8").split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^INTERNAL_API_SECRET=(.*)$/.exec(line);
    if (!m) continue;
    let val = m[1].trim().replace(/\r$/, "");
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val) {
      process.env.INTERNAL_API_SECRET = val;
      if (!(process.env.PLAYWRIGHT_INTERNAL_API_SECRET ?? "").trim()) {
        process.env.PLAYWRIGHT_INTERNAL_API_SECRET = val;
      }
      console.log("[e2e] INTERNAL_API_SECRET aligned from root .env (internal/*)");
    }
    break;
  }
}

/** 未显式设置时写入 CI 仲裁 seed（不覆盖已有值）。 */
export function alignP3ArbitratorPlaywrightEmailsFromDefaultsIfUnset() {
  if (!(process.env.P3_SEED_ARBITRATOR_EMAIL ?? "").trim()) {
    process.env.P3_SEED_ARBITRATOR_EMAIL = E2E_CI_ARBITRATOR_EMAIL;
  }
  if (!(process.env.PLAYWRIGHT_ARBITRATOR_SEED_EMAIL ?? "").trim()) {
    process.env.PLAYWRIGHT_ARBITRATOR_SEED_EMAIL = E2E_CI_ARBITRATOR_EMAIL;
  }
}

/**
 * 一次调用：内部密钥 + P3（供 `npm run e2e` 与所有 **`run-e2e-api-*`** 同源）。
 * @param {string} repoRoot
 */
/**
 * 稳定性 / 全栈 E2E 需要 **`DATABASE_URL`**；与 gate 一致，未设时从根 **`.env`** 单行解析（不覆盖已有环境变量）。
 * @param {string} repoRoot
 */
export function loadDatabaseUrlFromRootIfUnset(repoRoot) {
  if ((process.env.DATABASE_URL ?? "").trim()) return;
  const dotenvPath = path.join(repoRoot, ".env");
  if (!existsSync(dotenvPath)) return;
  for (const line of readFileSync(dotenvPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = /^DATABASE_URL=(.+)$/.exec(t);
    if (!m) continue;
    let v = m[1].trim().replace(/^["']|["']$/g, "");
    if (v) {
      process.env.DATABASE_URL = v;
      console.log("[e2e] DATABASE_URL loaded from repo root .env");
    }
    break;
  }
}

export function alignPlaywrightProcessEnvFromRootDotenv(repoRoot) {
  alignP3ArbitratorPlaywrightEmailsFromDefaultsIfUnset();
  alignInternalApiSecretFromRootDotenv(repoRoot);
  loadDatabaseUrlFromRootIfUnset(repoRoot);
}
