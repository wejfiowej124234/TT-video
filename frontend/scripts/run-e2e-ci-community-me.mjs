/**
 * `npm run e2e:ci-community-me` 入口：与 **`run-production-gate-local.sh` / `npm run e2e`** 同形，
 * 避免裸 `playwright test` 时未走 **`run-e2e-default.mjs`** → 无 **`PLAYWRIGHT_RELAX_META_CHAIN_GUARD`**、
 * 未默认 **`PLAYWRIGHT_FULL_STACK=1`**、**`setup-meta-chain`** 在本地根 `.env` 无链元数据时假红。
 *
 * 默认 **`PLAYWRIGHT_E2E_STABILITY=1`**（与 gate 清单复跑一致）；已在 shell 导出则尊重覆盖。
 * 透传：`npm run e2e:ci-community-me -- --reporter=list`
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
const runner = path.join(frontendDir, "scripts", "run-e2e-default.mjs");
const r = spawnSync(
  process.execPath,
  ["./scripts/run-e2e-default.mjs", "e2e/community-me-data-state.spec.ts", "--project=chromium", ...passthrough],
  { cwd: frontendDir, stdio: "inherit", env: process.env },
);
process.exit(r.status === 0 ? 0 : typeof r.status === "number" ? r.status : 1);
