/**
 * Next 14/15 + Webpack 生产构建在部分 Windows 环境下会把 server chunk 放在 `.next/server/chunks/`，
 * 而 `webpack-runtime.js` 却 `require("./<id>.js")`（相对 `.next/server/`），导致
 * `Cannot find module './1682.js'`、整站 500、页面空白（仅见 next-hide-fouc）。
 * 在 `next build` 之后将 chunks 复制到 `server/` 根目录，使 `next start` 与静态分析一致。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(__dirname, "..", ".next", "server");
const chunksDir = path.join(serverDir, "chunks");

if (!fs.existsSync(chunksDir)) {
  console.warn("sync-server-chunks: skip (no .next/server/chunks yet)");
  process.exit(0);
}

const names = fs.readdirSync(chunksDir).filter((n) => n.endsWith(".js"));
let n = 0;
for (const name of names) {
  fs.copyFileSync(path.join(chunksDir, name), path.join(serverDir, name));
  n++;
}
console.log("sync-server-chunks: copied", n, "chunk files to .next/server/");
