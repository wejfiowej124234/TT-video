/**
 * 仅跑 **2026-04-26** `run-production-gate-local.sh` 记录的 **Chromium 失败用例**（清单：
 * **`evidence/playwright-chromium-failed-20260426-gate.list.txt`** → 解析为 **`e2e/*.spec.ts:<line>`**）。
 *
 * 环境与全量 **`npm run e2e`** 一致：委托 **`run-e2e-default.mjs`**（含 **`e2e-align-env-from-root.mjs`**、端口回收、**`cargo build`** 等）。
 *
 * 用法（cwd **frontend**）：
 *   `npm run e2e:chromium-failed-20260426`
 *   `npm run e2e:chromium-failed-20260426 -- --reporter=list`
 *
 * 本地默认 **`PLAYWRIGHT_E2E_STABILITY=1`**（与 gate 对齐）；须 **`DATABASE_URL`**（由根 `.env` 或环境注入）。
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { alignPlaywrightProcessEnvFromRootDotenv } from "./e2e-align-env-from-root.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..");
const repoRoot = path.join(frontendDir, "..");

alignPlaywrightProcessEnvFromRootDotenv(repoRoot);

function inCi() {
  const c = process.env.CI?.trim().toLowerCase();
  const g = process.env.GITHUB_ACTIONS?.trim().toLowerCase();
  return c === "true" || c === "1" || g === "true" || g === "1";
}

if (!inCi() && (process.env.PLAYWRIGHT_E2E_STABILITY ?? "").trim() === "") {
  process.env.PLAYWRIGHT_E2E_STABILITY = "1";
  console.log("[e2e:failed-slice] default PLAYWRIGHT_E2E_STABILITY=1 (match local production gate)");
}

if (process.env.PLAYWRIGHT_E2E_STABILITY === "1" && !(process.env.PLAYWRIGHT_RELAX_META_CHAIN_GUARD ?? "").trim()) {
  process.env.PLAYWRIGHT_RELAX_META_CHAIN_GUARD = "1";
  console.log("[e2e:failed-slice] PLAYWRIGHT_RELAX_META_CHAIN_GUARD → 1 (setup-meta-chain /meta)");
}

function loadFailedLineTargets() {
  const p = path.join(frontendDir, "evidence", "playwright-chromium-failed-20260426-gate.list.txt");
  if (!existsSync(p)) {
    console.error(`[e2e:failed-slice] missing list file: ${p}`);
    process.exit(1);
  }
  const out = [];
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = /^(e2e\/\S+\.spec\.ts):(\d+):\d+\s*›/.exec(t);
    if (!m) {
      console.warn("[e2e:failed-slice] skip unparsable line:", t.slice(0, 96));
      continue;
    }
    out.push(`${m[1]}:${m[2]}`);
  }
  if (!out.length) {
    console.error("[e2e:failed-slice] no targets parsed from list");
    process.exit(1);
  }
  return out;
}

const targets = loadFailedLineTargets();
console.log(`[e2e:failed-slice] ${targets.length} Playwright line targets from gate list`);

const runner = path.join(frontendDir, "scripts", "run-e2e-default.mjs");
const passthrough = process.argv.slice(2);
const r = spawnSync(process.execPath, [runner, ...targets, "--project=chromium", ...passthrough], {
  cwd: frontendDir,
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status === 0 ? 0 : (typeof r.status === "number" ? r.status : 1));
