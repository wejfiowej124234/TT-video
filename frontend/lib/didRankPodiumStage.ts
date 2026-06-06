/** Top3 领奖台舞台：槽位比例、弱光晕、底座台阶（游客/向导榜共用） */

/** 领奖台列最小高度（与卡片 `DID_RANK_PODIUM_CARD_MIN_H` + 台阶叠加；防 #2 列被 flex-end 压矮） */
export const DID_RANK_PODIUM_COLUMN_MIN_H = "min-h-[11.25rem] sm:min-h-[12rem]";

export function didRankPodiumSlotClass(rank: number): string {
  if (rank === 1) return "order-2 flex-[1_1_6.5rem] sm:min-w-[7rem] sm:max-w-[11rem]";
  if (rank === 2) return "order-1 flex-[1_1_6.25rem] sm:min-w-[6.5rem] sm:max-w-[10rem]";
  if (rank === 3) return "order-3 flex-[1_1_6rem] sm:min-w-[6.25rem] sm:max-w-[9.5rem]";
  return "";
}

/** 领奖台 `motion` 列：固定最小高度 + 底对齐，避免 #2 框矮于 #3 */
export function didRankPodiumColumnClass(rank: number): string {
  const slot = didRankPodiumSlotClass(rank);
  if (rank < 1 || rank > 3) return slot;
  return `${slot} flex flex-col justify-end ${DID_RANK_PODIUM_COLUMN_MIN_H}`;
}

export function didRankPodiumStageWrapClass(rank: number): string {
  const base = "relative flex w-full flex-1 flex-col items-center";
  if (rank === 1) return `${base} z-10 sm:-mt-2`;
  if (rank === 2) return `${base} z-[9]`;
  if (rank === 3) return `${base} z-[8]`;
  return base;
}

export function didRankPodiumGlowClass(rank: number): string {
  if (rank === 1) {
    return "pointer-events-none absolute -inset-3 -z-10 rounded-[var(--radius-lg)] bg-ref-sun/[0.09] blur-lg animate-did-rank-champion-glow motion-reduce:hidden motion-reduce:animate-none";
  }
  if (rank === 2 || rank === 3) {
    return "pointer-events-none absolute -inset-1.5 -z-10 rounded-[var(--radius-md)] bg-ref-sun/[0.05] blur-sm motion-reduce:hidden";
  }
  return "";
}

/** 底座台阶高度：1 > 2 > 3（`items-end` 领奖台视觉） */
export function didRankPodiumPedestalClass(rank: number): string {
  const base =
    "mt-1.5 w-[88%] rounded-t-[var(--radius-sm)] motion-reduce:hidden shrink-0";
  if (rank === 1) {
    return `${base} h-6 sm:h-7 max-w-[7.5rem] bg-gradient-to-t from-ref-sun/30 to-ref-sun/8 shadow-[0_-4px_14px_-6px_rgba(252,164,124,0.32)]`;
  }
  if (rank === 2) {
    return `${base} h-4 sm:h-5 max-w-[6.75rem] bg-gradient-to-t from-ref-coral/24 to-ref-coral/6`;
  }
  if (rank === 3) {
    return `${base} h-2.5 sm:h-3 max-w-[6.25rem] bg-gradient-to-t from-ref-sun/20 to-ref-sun/5`;
  }
  return "";
}
