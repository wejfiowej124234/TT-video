/**
 * Turbopack dev expects `.next/fallback-build-manifest.json`. After `next build`,
 * `.next` is a production layout without that file; `next dev --turbopack` (Next 15+)
 * then throws ENOENT and route chunks (e.g. did-rank) return 500.
 *
 * Also purge **torn** `.next`: e.g. `server/` exists but `middleware-manifest.json` is missing
 * → `Cannot find module '...middleware-manifest.json'` and `_buildManifest.js.tmp.*` ENOENT
 * on Windows (crash, antivirus, or two dev servers fighting the same folder).
 *
 * PostCSS (Next 15 + Turbopack): child process may load `.next/postcss.js`. If that bridge is
 * missing/corrupt, globals.css fails with MODULE_NOT_FOUND — run `npm run dev:clean` or `npm run clean`
 * then a single `npm run dev`; fallback: `npm run dev:webpack`.
 *
 * **Windows**：长时间 Turbopack dev 还可能触发 `server/app/.../app-build-manifest.json` 与
 * `static/development/_buildManifest.js.tmp.*` ENOENT；**默认 `npm run dev` 已改走 Webpack**（`run-dev.mjs`）。
 * 仍要用 Turbopack：`npm run dev:turbopack` 或 `TRAVELTRUST_DEV_TURBO=1 npm run dev`。
 *
 * Flags: `--force` = always remove `.next` if present (same as clean + dev).
 * Env: `TRAVELTRUST_SKIP_TURBO_NEXT_CHECK=1` = skip this script.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextDir = path.join(__dirname, "..", ".next");
const fallbackPath = path.join(nextDir, "fallback-build-manifest.json");
const prodMarkerPath = path.join(nextDir, "required-server-files.json");
const serverDir = path.join(nextDir, "server");
const middlewareManifestPath = path.join(serverDir, "middleware-manifest.json");
const postcssBridgePath = path.join(nextDir, "postcss.js");

if (process.env.TRAVELTRUST_SKIP_TURBO_NEXT_CHECK === "1") {
  process.exit(0);
}

const forceClean = process.argv.includes("--force");

if (forceClean && fs.existsSync(nextDir)) {
  console.warn(
    "[traveltrust] ensure-turbo-dev --force: removing .next (then start Turbopack; use after PostCSS/Turbopack errors)."
  );
  fs.rmSync(nextDir, { recursive: true, force: true });
  await delay(250);
  process.exit(0);
}

if (!fs.existsSync(nextDir)) {
  process.exit(0);
}

const hasProdMarker = fs.existsSync(prodMarkerPath);
const hasFallback = fs.existsSync(fallbackPath);
const serverDirExists = fs.existsSync(serverDir);
const hasMiddlewareManifest = fs.existsSync(middlewareManifestPath);
/** Incomplete dev tree: Next will require middleware-manifest as soon as dev server boots */
const serverIncomplete = serverDirExists && !hasMiddlewareManifest;
/** Turbopack PostCSS bridge file present but empty (interrupted write / AV) */
let postcssBridgeEmpty = false;
try {
  postcssBridgeEmpty =
    fs.existsSync(postcssBridgePath) && fs.statSync(postcssBridgePath).size === 0;
} catch {
  postcssBridgeEmpty = false;
}

if (hasProdMarker || !hasFallback || serverIncomplete || postcssBridgeEmpty) {
  const reason = hasProdMarker
    ? "production build artifacts (required-server-files.json) detected"
    : postcssBridgeEmpty
      ? ".next/postcss.js is empty (Turbopack PostCSS bridge corrupt)"
      : !hasFallback
        ? "fallback-build-manifest.json missing (stale or mixed .next)"
        : "server/middleware-manifest.json missing (incomplete .next — stop duplicate `next dev`, then clean)";
  console.warn(
    `[traveltrust] Removing .next before Turbopack dev: ${reason}. ` +
      "Symptoms if mixed: /market 404, /_next/static/chunks/*.js 404, middleware-manifest MODULE_NOT_FOUND, " +
      "Cannot find module '.next/postcss.js', _buildManifest.js.tmp ENOENT. " +
      "Run `npm run build` only for `npm run start`; use `npm run dev` / `npm run dev:clean` for local dev. " +
      "Still stuck: `npm run dev:webpack` or `node scripts/ensure-turbo-dev.mjs --force` then `npm run dev`."
  );
  fs.rmSync(nextDir, { recursive: true, force: true });
  await delay(250);
}
