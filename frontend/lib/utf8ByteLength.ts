/**
 * UTF-8 字节长度；与 Rust **`str::len()`** 一致（社区 **`tag` / `tags[]`** 上限见 **`posts.rs`**）。
 */
export function utf8ByteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}
