/**
 * 本地 `npm run dev` 入口。
 *
 * **Windows + Next 15 Turbopack**：长时间开发、多路由切换、频繁 HMR 后易出现
 * `app-build-manifest.json` ENOENT、`.next/static/development/_buildManifest.js.tmp.*` ENOENT
 *（与 `ensure-turbo-dev.mjs` 中「torn .next」同类问题）。
 * **默认在 win32 使用 Webpack dev**（`next dev -p 3012`），稳定性更好。
 *
 * **强制 Turbopack（全平台）**：`npm run dev:turbopack`
 * **在 Windows 上仍要默认脚本走 Turbopack**：`set TRAVELTRUST_DEV_TURBO=1` 后 `npm run dev`
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

function runNodeScript(rel) {
  const script = path.join(root, rel);
  const r = spawnSync(process.execPath, [script], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function runNext(args) {
  const r = spawnSync(process.execPath, [nextBin, ...args], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const isWin = process.platform === "win32";
const forceTurbo = process.env.TRAVELTRUST_DEV_TURBO === "1";

if (isWin && !forceTurbo) {
  console.warn(
    "[traveltrust] dev: Webpack on Windows (avoid Turbopack HMR manifest races). " +
      "Use `npm run dev:turbopack` or TRAVELTRUST_DEV_TURBO=1 for Turbopack."
  );
  runNodeScript("scripts/ensure-dev-next.mjs");
  runNext(["dev", "-p", "3012"]);
} else {
  runNodeScript("scripts/ensure-turbo-dev.mjs");
  runNext(["dev", "--turbopack", "-p", "3012"]);
}
