/**
 * 94/31 市场子站 + 社区发布 E2E：**API 基址**与**二进制夹具**（入口见 `market-subsite-studio-and-community-publish.spec.ts`）。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { defaultApiBase } from "./helpers/apiSession";

export const API_BASE = defaultApiBase();

/** 与 API **`upload-media`** 魔数 / 体限对齐的极小 MP4（Chromium 可读 metadata）；路径相对 **`cd frontend`** */
export const E2E_VIDEO_1S_MP4_BYTES = readFileSync(
  join(process.cwd(), "e2e", "fixtures", "minimal-1s-h264.mp4"),
);

/** 1×1 PNG（极小）供 `setInputFiles` 走选图 → `upload-media` → 发帖闭环 */
export const E2E_PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

