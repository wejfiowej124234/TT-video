/**
 * Trust-gate Playwright：**全栈** `POST /auth/seed-trust-gate-e2e`（须根环境 **`SEED_TEST_ACCOUNTS=1`**）+ 真实 API。
 * 默认注入 **`EVIDENCE_MAX_REQUESTS_PER_MINUTE=2`**（证据限流用例）。
 *
 * 入口：**`npm run e2e:trust-gate`**。
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..");

if (!(process.env.EVIDENCE_MAX_REQUESTS_PER_MINUTE ?? "").trim()) {
  process.env.EVIDENCE_MAX_REQUESTS_PER_MINUTE = "2";
}

const specs = [
  "e2e/trust-gate-escrow.spec.ts",
  "e2e/trust-gate-dispute-resolve.spec.ts",
  "e2e/trust-gate-dispute-evidence.spec.ts",
  "e2e/trust-gate-dispute-execute-intent.spec.ts",
];

const r = spawnSync(
  process.execPath,
  ["./scripts/run-e2e-default.mjs", "--project=chromium", ...specs, ...process.argv.slice(2)],
  { cwd: frontendDir, stdio: "inherit", env: process.env },
);
process.exit(typeof r.status === "number" ? r.status : 1);
