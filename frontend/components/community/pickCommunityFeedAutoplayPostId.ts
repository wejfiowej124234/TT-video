/** 从各卡片上报的 intersectionRatio 中选出应 autoplay 的视频帖（同一时刻仅一条）。 */
export function pickCommunityFeedAutoplayPostId(
  visibility: ReadonlyMap<string, number>,
  minRatio = 0.55,
): string | null {
  let bestId: string | null = null;
  let bestRatio = minRatio - 1e-9;
  for (const [id, ratio] of visibility) {
    if (ratio >= minRatio && ratio > bestRatio) {
      bestId = id;
      bestRatio = ratio;
    }
  }
  return bestId;
}
