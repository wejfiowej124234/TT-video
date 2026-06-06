#!/usr/bin/env node
/**
 * TT-PH1-030b · ① tier-1 占位 MP4（~2KB H.264，同源 e2e/fixtures/minimal-1s-h264.mp4）
 * 生产级短片请替换 public/media/traveltrust/* 或配置 NEXT_PUBLIC_* env。
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "e2e", "fixtures", "minimal-1s-h264.mp4");
const base = join(root, "public", "media", "traveltrust");

mkdirSync(join(base, "roles"), { recursive: true });
copyFileSync(src, join(base, "hero-loop.mp4"));
for (const role of [
  "traveler",
  "guide",
  "provider",
  "merchant",
  "acquisition",
  "region_steward",
]) {
  copyFileSync(src, join(base, "roles", `${role}.mp4`));
}
console.log("TT-PH1-030b: copied tier-1 placeholder MP4 → public/media/traveltrust/ (+ merchant, acquisition)");
