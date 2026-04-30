"use client";

/**
 * `/community/me` 玻璃抽屉内列表：与 `CommunityMePostsShowcaseThumbGrid` / `CommunityMeNotesPostThumbGrid` 同构的三列骨架，
 * 避免 `CommunityMeDataStateSurface` 默认 loading 仅一段文字、与真实方格布局不一致（生产级 IA / a11y）。
 */
export function CommunityMeDrawerGridLoadingSkeleton({
  ariaLabel,
  slots = 3,
  minHeightClass = "min-h-[168px]",
}: {
  ariaLabel: string;
  /** 占位格数（默认一行三格） */
  slots?: number;
  minHeightClass?: string;
}) {
  return (
    <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0" aria-busy="true" aria-label={ariaLabel}>
      {Array.from({ length: slots }, (_, i) => (
        <li key={i} className="min-w-0">
          <div className={`${minHeightClass} animate-pulse motion-reduce:animate-none rounded-[var(--radius-md)] bg-white/10`} />
        </li>
      ))}
    </ul>
  );
}
