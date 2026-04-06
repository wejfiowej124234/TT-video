"use client";

/** 52 §7.5：好友/关注列表加载骨架，先出壳再出数 */
const ROWS = 5;

export function CommunityFriendsListSkeleton() {
  return (
    <ul className="divide-y divide-slate-600/50" aria-hidden>
      {Array.from({ length: ROWS }).map((_, i) => (
        <li key={i} className="flex min-h-[44px] items-center justify-start gap-3 px-4 py-3">
          <div className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 rounded-full bg-slate-700/80 animate-pulse" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-28 rounded-[var(--radius-sm)] bg-slate-600/70 animate-pulse" />
            <div className="h-3 w-16 rounded-[var(--radius-sm)] bg-slate-700/60 animate-pulse" />
          </div>
          <div className="h-11 min-h-[44px] w-20 shrink-0 rounded-full bg-slate-600/60 animate-pulse" />
        </li>
      ))}
    </ul>
  );
}
