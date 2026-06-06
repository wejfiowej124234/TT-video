import { useEffect, useRef } from "react";

export function useCommunityFeedListLoadMoreSentinel(opts: {
  hasMore: boolean;
  feedLoading: boolean;
  feedLoadingMore: boolean;
  onLoadMore: () => void;
}) {
  const { hasMore, feedLoading, feedLoadingMore, onLoadMore } = opts;
  const loadSentinelRef = useRef<HTMLDivElement>(null);

  /** 31 §3.2：触底（或接近底部）自动加载；与按钮共用 onLoadMore，由 hook 内防重入 */
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    if (!hasMore || feedLoading) return;
    const node = loadSentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) onLoadMore();
      },
      { root: null, rootMargin: "280px 0px 0px 0px", threshold: 0 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasMore, feedLoading, feedLoadingMore, onLoadMore]);

  return { loadSentinelRef };
}
