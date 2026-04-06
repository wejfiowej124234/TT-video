/**
 * `next start` 必须对应一次完整的 `next build`。若误用 Turbopack/Webpack dev 的 `.next`，
 * 或从未构建，会出现页面 404 与 /_next/static 下 chunk、css 全部 404。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextDir = path.join(__dirname, "..", ".next");
const buildIdPath = path.join(nextDir, "BUILD_ID");
const prodMarkerPath = path.join(nextDir, "required-server-files.json");
const routesManifestPath = path.join(nextDir, "routes-manifest.json");
const serverDir = path.join(nextDir, "server");
const appPathsManifestPath = path.join(serverDir, "app-paths-manifest.json");

if (process.env.TRAVELTRUST_SKIP_NEXT_START_CHECK === "1") {
  process.exit(0);
}

if (!fs.existsSync(nextDir)) {
  console.error(
    "[traveltrust] Missing .next. Run from frontend/: npm run clean && npm run build && npm run start"
  );
  process.exit(1);
}

if (!fs.existsSync(buildIdPath)) {
  console.error(
    "[traveltrust] .next/BUILD_ID missing — not a production build. " +
      "If you used `next dev` before, run: npm run clean && npm run build && npm run start"
  );
  process.exit(1);
}

if (!fs.existsSync(prodMarkerPath)) {
  console.error(
    "[traveltrust] .next/required-server-files.json missing — incomplete or dev-only .next. " +
      "Do not use `next start` after Turbopack/Webpack dev without rebuilding. " +
      "Run: npm run clean && npm run build && npm run start"
  );
  process.exit(1);
}

if (!fs.existsSync(routesManifestPath)) {
  console.error(
    "[traveltrust] .next/routes-manifest.json missing — incomplete production build (often after interrupted build). " +
      "Run: npm run clean && npm run build && npm run start"
  );
  process.exit(1);
}

if (fs.existsSync(serverDir) && !fs.existsSync(appPathsManifestPath)) {
  console.error(
    "[traveltrust] .next/server/app-paths-manifest.json missing — incomplete production build. " +
      "Run: npm run clean && npm run build && npm run start"
  );
  process.exit(1);
}
