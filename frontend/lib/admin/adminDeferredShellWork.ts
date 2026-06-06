/** ① Admin 壳层非关键任务：让出主线程与网络带宽给路由 RSC / 首屏页身。 */
export function scheduleAdminDeferredShellWork(
  fn: () => void,
  options?: { timeoutMs?: number },
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const timeoutMs = options?.timeoutMs ?? 1400;
  let cancelled = false;
  let timeoutId: number | undefined;

  const run = () => {
    if (cancelled) return;
    fn();
  };

  const ric = window.requestIdleCallback;
  if (typeof ric === "function") {
    const idleId = ric(() => run(), { timeout: timeoutMs });
    return () => {
      cancelled = true;
      window.cancelIdleCallback?.(idleId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }

  timeoutId = window.setTimeout(run, Math.min(timeoutMs, 480));
  return () => {
    cancelled = true;
    if (timeoutId) clearTimeout(timeoutId);
  };
}
