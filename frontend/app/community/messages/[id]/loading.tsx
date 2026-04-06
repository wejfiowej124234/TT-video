"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与会话详情页布局一致：顶栏 + 气泡区脉冲 + 底栏输入槽 */
export default function CommunityConversationLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-4xl mx-auto flex flex-col min-h-0 h-[calc(100vh-8rem)]"
      role="status"
      aria-label={t("community_conversation_thread_aria")}
      aria-busy="true"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-cyan-500/30 bg-slate-900/80 px-4 py-3 safe-area-inset-t" aria-hidden>
        <div className="min-h-[44px] h-11 w-24 rounded-[var(--radius-md)] bg-slate-800/80 border border-slate-500/50 animate-pulse shrink-0" />
        <div className="h-11 w-11 rounded-full bg-slate-700/70 ring-2 ring-cyan-400/30 animate-pulse shrink-0" />
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="h-5 w-24 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="h-3 w-20 bg-slate-700/45 rounded-[var(--radius-sm)] animate-pulse" />
        </div>
      </header>
      <div className="flex-1 overflow-hidden px-4 py-3 space-y-3 min-h-0" aria-hidden>
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-[var(--radius-md)] px-3 py-2 border border-slate-600/50 bg-slate-800/80 space-y-2 w-48">
            <div className="h-3 w-full bg-slate-600/40 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-3 w-3/4 bg-slate-700/35 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-[var(--radius-md)] px-3 py-2 border border-cyan-400/40 bg-cyan-500/20 space-y-2 w-40">
            <div className="h-3 w-full bg-cyan-400/15 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-3 w-2/3 bg-cyan-400/10 rounded-[var(--radius-sm)] animate-pulse ml-auto" />
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-[var(--radius-md)] px-3 py-2 border border-slate-600/50 bg-slate-800/80 w-56 h-14 animate-pulse opacity-80" />
        </div>
      </div>
      <div className="flex shrink-0 border-t border-cyan-500/30 bg-slate-900/90 p-3 safe-area-inset-b" aria-hidden>
        <div className="flex gap-2 w-full">
          <div className="flex-1 min-h-[44px] h-11 rounded-[var(--radius-md)] border border-cyan-500/40 bg-slate-800 animate-pulse" />
          <div className="min-h-[44px] h-11 w-20 rounded-[var(--radius-md)] border border-cyan-400/50 bg-cyan-500/15 animate-pulse shrink-0" />
        </div>
      </div>
    </main>
  );
}
