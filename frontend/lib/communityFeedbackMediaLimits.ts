/**
 * **`POST /api/v1/community/feedback`** 的 **`media_urls[]`** 单条 UTF-8 长度上限（与
 * `crates/api/src/routes/community/feedback_reports/feedback/parse_media.rs` **`FEEDBACK_MEDIA_ITEM_MAX_BYTES`**
 *、`docs/spec/04-后端与API.md` §三 同源）。
 *
 * 反馈附件走浏览器 **`data:{mime};base64,`** 内嵌；预检须按**编码后**字符串长度估算，
 * 不能仅用原始 **`File.size`**（否则易在 ~0.7–0.8MB 区间通过客户端却触发 **`feedback_media_too_large`**）。
 */

export const FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES = 950_000;

/** RFC 4648 Base64 无换行：`ceil(byteLength / 3) * 4`。 */
export function feedbackDataUrlBase64CharCount(byteLength: number): number {
  if (!Number.isFinite(byteLength) || byteLength <= 0) return 0;
  return Math.ceil(byteLength / 3) * 4;
}

/**
 * ASCII **`data:{mime};base64,`** 前缀长度 + Base64 字符数（与 Rust **`s.len()`** 对 **`data:`** URL 一致）。
 * @param mime 须含类型与子类型，如 **`image/jpeg`**、**`video/mp4`**（勿含 `data:` 前缀）。
 */
export function estimateFeedbackDataUrlUtf8ByteLength(mime: string, rawByteLength: number): number {
  const safeMime = mime.trim() || "application/octet-stream";
  const prefix = `data:${safeMime};base64,`;
  return prefix.length + feedbackDataUrlBase64CharCount(rawByteLength);
}

/**
 * 在读取为 Data URL 之前，按即将使用的 MIME 判断编码后是否会超过反馈单条上限。
 */
export function feedbackDataUrlWouldExceedItemLimit(mime: string, rawByteLength: number): boolean {
  return estimateFeedbackDataUrlUtf8ByteLength(mime, rawByteLength) > FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES;
}
