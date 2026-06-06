/**
 * 排行榜 Top3 色阶 — 1 日出金 · 2 珊瑚 · 3 日出金浅（哑光 · 无 cyan 光晕 · PR-F）
 */
export type RefTopThreeTier = {
  shell: string;
  hover: string;
  rankText: string;
  avatarRing: string;
  avatarPlaceholder: string;
};

const NEUTRAL_TRAVELER: RefTopThreeTier = {
  shell: "border border-ref-sun/12 bg-ink-800/48 backdrop-blur-sm",
  hover: "hover:border-ref-sun/18 hover:bg-ink-800/55",
  rankText: "text-slate-300",
  avatarRing: "ring-1 ring-ref-sun/20",
  avatarPlaceholder: "bg-ref-sun/10 text-ref-sun/90",
};

const NEUTRAL_GUIDE: RefTopThreeTier = {
  shell: "border border-fuchsia-500/14 bg-ink-800/48 backdrop-blur-sm",
  hover: "hover:border-fuchsia-400/22 hover:bg-ink-800/55",
  rankText: "text-fuchsia-300/85",
  avatarRing: "ring-1 ring-inset ring-fuchsia-400/24",
  avatarPlaceholder: "bg-fuchsia-500/10 text-fuchsia-200/90",
};

const T1: RefTopThreeTier = {
  shell:
    "border border-ref-sun/26 bg-ink-800/58 backdrop-blur-md shadow-[0_8px_28px_-16px_rgba(252,164,124,0.35)]",
  hover: "hover:border-ref-sun/34 hover:bg-ink-800/62 hover:shadow-[0_10px_32px_-14px_rgba(252,164,124,0.4)]",
  rankText: "text-ref-sun",
  avatarRing: "ring-2 ring-inset ring-ref-sun/40",
  avatarPlaceholder: "bg-ref-sun/14 text-ref-sun",
};

const T2: RefTopThreeTier = {
  shell: "border border-ref-coral/22 bg-ink-800/52 backdrop-blur-sm",
  hover: "hover:border-ref-coral/30 hover:bg-ink-800/58",
  rankText: "text-ref-coral",
  avatarRing: "ring-2 ring-inset ring-ref-coral/32",
  avatarPlaceholder: "bg-ref-coral/12 text-ref-coral",
};

const T3: RefTopThreeTier = {
  shell: "border border-ref-sun/18 bg-ink-800/50 backdrop-blur-sm",
  hover: "hover:border-ref-sun/26 hover:bg-ink-800/56",
  rankText: "text-ref-sun/95",
  avatarRing: "ring-2 ring-inset ring-ref-sun/28",
  avatarPlaceholder: "bg-ref-sun/12 text-ref-sun/90",
};

const GUIDE_T1: RefTopThreeTier = {
  shell:
    "border border-fuchsia-500/30 bg-ink-800/58 backdrop-blur-md shadow-[0_8px_28px_-16px_rgba(217,70,239,0.32)]",
  hover: "hover:border-fuchsia-400/38 hover:bg-ink-800/62 hover:shadow-[0_10px_32px_-14px_rgba(217,70,239,0.38)]",
  rankText: "text-fuchsia-300",
  avatarRing: "ring-2 ring-inset ring-fuchsia-400/42",
  avatarPlaceholder: "bg-fuchsia-500/14 text-fuchsia-200",
};

const GUIDE_T2: RefTopThreeTier = {
  shell: "border border-fuchsia-500/24 bg-ink-800/52 backdrop-blur-sm",
  hover: "hover:border-fuchsia-400/32 hover:bg-ink-800/58",
  rankText: "text-fuchsia-300/95",
  avatarRing: "ring-2 ring-inset ring-fuchsia-400/34",
  avatarPlaceholder: "bg-fuchsia-500/12 text-fuchsia-200/95",
};

const GUIDE_T3: RefTopThreeTier = {
  shell: "border border-fuchsia-500/20 bg-ink-800/50 backdrop-blur-sm",
  hover: "hover:border-fuchsia-400/28 hover:bg-ink-800/56",
  rankText: "text-fuchsia-200/90",
  avatarRing: "ring-2 ring-inset ring-fuchsia-400/28",
  avatarPlaceholder: "bg-fuchsia-500/10 text-fuchsia-200/90",
};

export function refTopThreeTier(rank: number, column: "traveler" | "guide" = "traveler"): RefTopThreeTier {
  if (column === "guide") {
    if (rank === 1) return GUIDE_T1;
    if (rank === 2) return GUIDE_T2;
    if (rank === 3) return GUIDE_T3;
    return NEUTRAL_GUIDE;
  }
  if (rank === 1) return T1;
  if (rank === 2) return T2;
  if (rank === 3) return T3;
  return NEUTRAL_TRAVELER;
}
