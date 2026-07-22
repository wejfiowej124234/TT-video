#!/usr/bin/env node
/**
 * TT-PH1-030b · ① tier-1 占位 MP4（~2KB H.264，同源 e2e/fixtures/minimal-1s-h264.mp4）
 * 生产级短片：Owner 投放 `首页角色宣传片/` 后跑
 *   `node scripts/dev/sync-traveltrust-role-promo-videos.cjs`
 * 本脚本不会覆盖已存在的大体积宣传片（≥100 KiB）。
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "e2e", "fixtures", "minimal-1s-h264.mp4");
const base = join(root, "public", "media", "traveltrust");

/** Skip overwrite when Owner promo (or any real clip) is already present (>100 KiB). */
const PROMO_MIN_BYTES = 100 * 1024;

function copyTier1UnlessPromo(dest) {
  if (existsSync(dest)) {
    try {
      if (statSync(dest).size >= PROMO_MIN_BYTES) {
        console.log(`TT-PH1-030b: keep existing promo/media ${dest} (${statSync(dest).size} bytes)`);
        return;
      }
    } catch {
      /* fall through */
    }
  }
  copyFileSync(src, dest);
}

mkdirSync(join(base, "roles"), { recursive: true });
copyTier1UnlessPromo(join(base, "hero-loop.mp4"));
for (const role of [
  "traveler",
  "guide",
  "provider",
  "merchant",
  "acquisition",
  "region_steward",
]) {
  copyTier1UnlessPromo(join(base, "roles", `${role}.mp4`));
}
console.log("TT-PH1-030b: tier-1 placeholder MP4 seeded (skips existing promo-sized files)");
