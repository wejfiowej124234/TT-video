/**
 * npm lifecycle `prepare` 后置可选步骤（默认无操作，避免拖慢每次 install）。
 *
 * | 环境变量 | 行为 |
 * |----------|------|
 * | FRONTEND_PREPARE_NPM_CI=1 | 在 frontend 目录执行 `npm ci`（须已有 package-lock；与 clean 顺序：先 clean 再 ci） |
 *
 * 说明：根目录 Rust `target/debug/*.exe` 不由本脚本清理；若需整仓清缓存请用手工或单独运维脚本。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");
const lock = path.join(frontendRoot, "package-lock.json");

if (process.env.FRONTEND_PREPARE_NPM_CI === "1") {
  if (!fs.existsSync(lock)) {
    console.error("prepare-optional: FRONTEND_PREPARE_NPM_CI=1 but package-lock.json missing; abort");
    process.exit(1);
  }
  console.log("prepare-optional: running npm ci (FRONTEND_PREPARE_NPM_CI=1)");
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["ci"], {
    cwd: frontendRoot,
    stdio: "inherit",
    shell: false,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
} else {
  console.log("prepare-optional: skip (set FRONTEND_PREPARE_NPM_CI=1 for npm ci after clean)");
}
