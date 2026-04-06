"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** TT 子页首屏：居中玻璃卡片骨架（与 page 布局对齐，不依赖 dynamic 背景） */
export default function CommunityTTLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="relative min-h-[60vh] flex flex-col items-center justify-center px-4 bg-slate-950"
      role="status"
      aria-label={t("community_tt_title")}
      aria-busy="true"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950 pointer-events-none" aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-[var(--radius-md)] p-8 bg-slate-900/70 backdrop-blur-md border border-cyan-500/30 shadow-scifi-panel-lo space-y-4 animate-pulse">
        <div className="min-h-[44px] h-11 w-4/5 mx-auto bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 rounded" aria-hidden />
        <div className="h-4 w-full bg-slate-700/50 rounded" aria-hidden />
        <div className="h-4 w-11/12 mx-auto bg-slate-700/40 rounded" aria-hidden />
        <div className="h-12 w-44 mx-auto rounded-[var(--radius-md)] bg-cyan-500/20 border border-cyan-400/30 mt-2" aria-hidden />
      </div>
    </main>
  );
}
