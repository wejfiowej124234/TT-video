/**
 * Tropical jade sunrise / 排行榜参考：Top3 色阶 — 1 青绿 · 2 珊瑚 · 3 日出金（深色玻璃底上）
 */
export type RefTopThreeTier = {
  shell: string;
  hover: string;
  rankText: string;
  avatarRing: string;
  avatarPlaceholder: string;
};

const NEUTRAL_TRAVELER: RefTopThreeTier = {
  shell: "border border-slate-600 bg-slate-800/55 backdrop-blur-sm",
  hover: "hover:border-slate-500 hover:bg-slate-800/70",
  rankText: "text-slate-300",
  avatarRing: "ring-2 ring-slate-500/40",
  avatarPlaceholder: "bg-slate-600/50 text-slate-300",
};

const NEUTRAL_GUIDE: RefTopThreeTier = {
  shell: "border border-fuchsia-900/35 bg-slate-800/55 backdrop-blur-sm",
  hover: "hover:border-fuchsia-500/35 hover:bg-slate-800/70",
  rankText: "text-slate-300",
  avatarRing: "ring-2 ring-fuchsia-400/25",
  avatarPlaceholder: "bg-fuchsia-500/20 text-fuchsia-300",
};

const T1: RefTopThreeTier = {
  shell:
    "border-2 border-ref-cyan/55 bg-slate-900/35 backdrop-blur-md ring-1 ring-ref-cyan/25 shadow-[0_0_28px_-6px_rgba(35,206,217,0.42)]",
  hover: "hover:border-ref-cyan/90 hover:shadow-[0_0_36px_-4px_rgba(35,206,217,0.55)]",
  rankText: "text-ref-cyan drop-shadow-[0_0_10px_rgba(35,206,217,0.5)]",
  avatarRing: "ring-2 ring-ref-cyan/55",
  avatarPlaceholder: "bg-ref-cyan/20 text-ref-cyan",
};

const T2: RefTopThreeTier = {
  shell:
    "border-2 border-ref-coral/50 bg-slate-900/35 backdrop-blur-md ring-1 ring-ref-coral/20 shadow-[0_0_26px_-6px_rgba(252,164,124,0.38)]",
  hover: "hover:border-ref-coral/85 hover:shadow-[0_0_32px_-4px_rgba(252,164,124,0.48)]",
  rankText: "text-ref-coral drop-shadow-[0_0_10px_rgba(252,164,124,0.45)]",
  avatarRing: "ring-2 ring-ref-coral/50",
  avatarPlaceholder: "bg-ref-coral/20 text-ref-coral",
};

const T3: RefTopThreeTier = {
  shell:
    "border-2 border-ref-sun/50 bg-slate-900/35 backdrop-blur-md ring-1 ring-ref-sun/25 shadow-[0_0_24px_-6px_rgba(249,215,121,0.35)]",
  hover: "hover:border-ref-sun/80 hover:shadow-[0_0_30px_-4px_rgba(249,215,121,0.42)]",
  rankText: "text-ref-sun drop-shadow-[0_0_10px_rgba(249,215,121,0.4)]",
  avatarRing: "ring-2 ring-ref-sun/45",
  avatarPlaceholder: "bg-ref-sun/15 text-ref-sun",
};

export function refTopThreeTier(rank: number, column: "traveler" | "guide" = "traveler"): RefTopThreeTier {
  if (rank === 1) return T1;
  if (rank === 2) return T2;
  if (rank === 3) return T3;
  return column === "guide" ? NEUTRAL_GUIDE : NEUTRAL_TRAVELER;
}
