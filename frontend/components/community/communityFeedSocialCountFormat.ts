/** 社区互动数展示（≥1k / ≥1w 缩写 · 与视频 overlay 一致） */
export function communityFeedSocialCountFormat(n: number): string {
  if (n >= 10_000) {
    const w = n / 10_000;
    return `${w >= 10 ? Math.round(w) : w.toFixed(1).replace(/\.0$/, "")}w`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}
