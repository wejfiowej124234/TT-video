/** 30 §4.3：Top3 光晕层（挂在卡片背后的空节点，避免文字随 box-shadow 动画发糊/跳动） */

export function didRankTop3GlowLayerClass(rank: number): string {
  const base =
    "pointer-events-none absolute inset-0 rounded-[var(--radius-md)] motion-reduce:animate-none";
  if (rank === 1) return `${base} animate-did-glow-sun`;
  if (rank === 2) return `${base} animate-did-glow`;
  if (rank === 3) return `${base} animate-did-glow-fuchsia`;
  return "";
}

/** @deprecated 勿加在含文字的卡片根节点；请用 `didRankTop3GlowLayerClass` */
export function didRankTop3GlowClass(rank: number): string {
  return didRankTop3GlowLayerClass(rank);
}
