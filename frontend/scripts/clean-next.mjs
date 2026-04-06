/**
 * 删除 `.next` 产物，修复：
 * - 缓存与 chunk 不一致（Cannot find module './xxxx.js'、build-manifest / app-build-manifest ENOENT、`_buildManifest.js.tmp.*` ENOENT）
 * - Turbopack + PostCSS 子进程报错：`Cannot find module '...\\.next\\postcss.js'`（见 `postcss.config.js` 与 `npm run dev:clean`）
 * - 升级依赖、大改路由后白屏/500
 *
 * 日常：`npm run dev` 会先跑 `ensure-turbo-dev.mjs`（混用 prod/dev 时自动删 `.next`）。
 * 生产：`npm run start` 前须 `npm run build`；`build` 后执行 `sync-server-chunks.mjs`。
 * Webpack dev：`npm run dev:webpack` 前跑 `ensure-dev-next.mjs`。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextDir = path.join(__dirname, "..", ".next");

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("clean-next: removed", nextDir);
} else {
  console.log("clean-next: skip (already absent)", nextDir);
}
