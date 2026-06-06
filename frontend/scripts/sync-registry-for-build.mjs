/**
 * Docker / 独立 frontend 构建：复制 repo 根 registry 片段到 frontend/registry/。
 * 本地全栈仍可用 ../../registry（见 marketGuideFilterQuery.ts）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");
const repoRoot = path.join(frontendRoot, "..");
const src = path.join(repoRoot, "registry", "market-guide-facet.v1.json");
const destDir = path.join(frontendRoot, "registry");
const dest = path.join(destDir, "market-guide-facet.v1.json");

if (!fs.existsSync(src)) {
  if (fs.existsSync(dest)) process.exit(0);
  console.error("[sync-registry-for-build] missing", src);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
