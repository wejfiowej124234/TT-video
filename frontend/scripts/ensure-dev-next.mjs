/**
 * `next dev`（Webpack 模式）不能与 `next build` 的 `.next` 混用：会表现为 /market 等路由 404、
 * /_next/static/chunks/*.js 大量 404（HTML 与 chunk 清单不一致）。
 * 在启动 Webpack dev 前若发现生产产物标记，则删除 `.next`。
 *
 * 若 Turbopack dev 报 PostCSS / `.next/postcss.js` MODULE_NOT_FOUND，可用 `npm run dev:webpack` 绕过。
 *
 * **routes-manifest.json / app-paths-manifest.json ENOENT**：非生产 `.next` 若缺路由清单或 server 侧 app-paths 清单，Webpack dev 会对 `/`、`/community` 等直接 500；
 * 常见于 Windows 编译被打断、`next.config` 触发热重启与长编译竞态、杀毒扫 `.next`、两个 dev 抢同一目录。启动前整目录删除以自愈。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextDir = path.join(__dirname, "..", ".next");
const prodMarkerPath = path.join(nextDir, "required-server-files.json");
const routesManifestPath = path.join(nextDir, "routes-manifest.json");
const serverDir = path.join(nextDir, "server");
const middlewareManifestPath = path.join(serverDir, "middleware-manifest.json");
const appPathsManifestPath = path.join(serverDir, "app-paths-manifest.json");

if (process.env.TRAVELTRUST_SKIP_DEV_NEXT_CHECK === "1") {
  process.exit(0);
}

if (!fs.existsSync(nextDir)) {
  process.exit(0);
}

const serverIncomplete = fs.existsSync(serverDir) && !fs.existsSync(middlewareManifestPath);

if (fs.existsSync(prodMarkerPath) || serverIncomplete) {
  const reason = fs.existsSync(prodMarkerPath)
    ? "production output is incompatible with `next dev` (webpack)"
    : "incomplete .next (missing server/middleware-manifest.json)";
  console.warn(
    `[traveltrust] Removing .next: ${reason}. ` +
      "Use `npm run build` only before `npm run start`; use `npm run dev` or `npm run dev:webpack` for local dev."
  );
  fs.rmSync(nextDir, { recursive: true, force: true });
}

/** 上一轮回话留下的残缺缓存（有 .next、非生产、缺清单 → GET 500） */
const devManifestTorn =
  fs.existsSync(nextDir) &&
  !fs.existsSync(prodMarkerPath) &&
  (!fs.existsSync(routesManifestPath) ||
    (fs.existsSync(serverDir) && !fs.existsSync(appPathsManifestPath)));

if (devManifestTorn) {
  const detail = !fs.existsSync(routesManifestPath)
    ? "missing routes-manifest.json"
    : "missing server/app-paths-manifest.json";
  console.warn(
    `[traveltrust] Removing .next: ${detail} (corrupt/incomplete Webpack dev cache). ` +
      "Typical: interrupted compile, next.config restart during compile, antivirus, or two `next dev` on the same folder. " +
      "Retry `npm run dev`. Tip: exclude `frontend/.next` from real-time AV if this repeats."
  );
  fs.rmSync(nextDir, { recursive: true, force: true });
}
