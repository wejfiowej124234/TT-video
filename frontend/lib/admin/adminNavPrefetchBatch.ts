type AdminRouterLike = {
  prefetch: (href: string) => void;
};

const prefetched = new Set<string>();

function normalizePrefetchHref(href: string): string {
  return href.trim();
}

/** 去重 + 分批 prefetch，避免 idle 时瞬时打满 dev server。 */
export function prefetchAdminRoutesBatched(
  router: AdminRouterLike,
  hrefs: readonly string[],
  options?: { batchSize?: number; gapMs?: number },
): void {
  if (typeof window === "undefined") return;

  const batchSize = options?.batchSize ?? 5;
  const gapMs = options?.gapMs ?? 72;
  const queue = hrefs
    .map(normalizePrefetchHref)
    .filter((href) => href.startsWith("/admin") && !prefetched.has(href));

  if (queue.length === 0) return;

  let index = 0;

  const runBatch = () => {
    const slice = queue.slice(index, index + batchSize);
    for (const href of slice) {
      prefetched.add(href);
      try {
        router.prefetch(href);
      } catch {
        /* noop */
      }
    }
    index += batchSize;
    if (index < queue.length) {
      window.setTimeout(runBatch, gapMs);
    }
  };

  runBatch();
}

/** @internal vitest */
export function resetAdminNavPrefetchCacheForTests(): void {
  prefetched.clear();
}
