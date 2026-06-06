/** Top3 行程卡：1 日出金 · 2 珊瑚 · 3 日出金浅（哑光 · PR-F） */
export const ITIN_TOP3_STYLE: Record<
  1 | 2 | 3,
  { card: string; rank: string; stats: string; btn: string; myBadge: string }
> = {
  1: {
    card: "rounded-[var(--radius-md)] border border-ref-sun/22 bg-ink-800/52 backdrop-blur-sm p-2 sm:p-3 min-w-0 motion-sub hover:border-ref-sun/30 hover:bg-ink-800/58",
    rank: "text-h4 font-bold font-mono text-ref-sun",
    stats: "text-meta text-ref-sun/90",
    btn: "mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/28 bg-ref-sun/10 px-2 py-1.5 text-meta font-medium text-ref-sun hover:bg-ref-sun/16 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
    myBadge: "rounded border border-ref-sun/32 bg-ref-sun/12 px-1.5 py-0.5 text-meta font-medium text-ref-sun",
  },
  2: {
    card: "rounded-[var(--radius-md)] border border-ref-coral/22 bg-ink-800/52 backdrop-blur-sm p-2 sm:p-3 min-w-0 motion-sub hover:border-ref-coral/30 hover:bg-ink-800/58",
    rank: "text-h4 font-bold font-mono text-ref-coral",
    stats: "text-meta text-ref-coral/90",
    btn: "mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] border border-ref-coral/28 bg-ref-coral/10 px-2 py-1.5 text-meta font-medium text-ref-coral hover:bg-ref-coral/16 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-coral/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
    myBadge: "rounded border border-ref-coral/32 bg-ref-coral/12 px-1.5 py-0.5 text-meta font-medium text-ref-coral",
  },
  3: {
    card: "rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-800/50 backdrop-blur-sm p-2 sm:p-3 min-w-0 motion-sub hover:border-ref-sun/26 hover:bg-ink-800/56",
    rank: "text-h4 font-bold font-mono text-ref-sun/95",
    stats: "text-meta text-ref-sun/85",
    btn: "mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/24 bg-ref-sun/8 px-2 py-1.5 text-meta font-medium text-ref-sun hover:bg-ref-sun/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
    myBadge: "rounded border border-ref-sun/28 bg-ref-sun/10 px-1.5 py-0.5 text-meta font-medium text-ref-sun/95",
  },
};
