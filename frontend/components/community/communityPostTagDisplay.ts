/** 展示用：去掉 tag 前导 #，避免 UI 出现 ##标签 */
export function communityPostTagDisplayLabel(tag: string): string {
  return tag.trim().replace(/^#+/, "");
}

/** 过滤空标签 / 仅 `#` 占位，避免渲染空心 pill */
export function communityPostTagsForDisplay(tags: readonly string[] | undefined | null): string[] {
  return (tags ?? []).filter((tag) => communityPostTagDisplayLabel(tag).length > 0);
}
