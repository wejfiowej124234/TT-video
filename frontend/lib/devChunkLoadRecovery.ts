/** 开发态 stale `.next` / 连接重置导致的 chunk 加载失败（① · Windows dev 常见）。 */
export function isDevChunkLoadMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("chunkloaderror") ||
    m.includes("loading chunk") ||
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("err_connection_reset") ||
    m.includes("connection reset") ||
    m.includes("invalid or unexpected token") ||
    (m.includes("_next/static") && (m.includes("404") || m.includes("failed")))
  );
}

export const DEV_CHUNK_AUTO_RELOAD_KEY = "tt-dev-chunk-auto-reload";

export function tryDevChunkAutoReload(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(DEV_CHUNK_AUTO_RELOAD_KEY) === "1") return false;
    sessionStorage.setItem(DEV_CHUNK_AUTO_RELOAD_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

export function clearDevChunkAutoReloadFlag(delayMs = 8000): () => void {
  const id = window.setTimeout(() => {
    try {
      sessionStorage.removeItem(DEV_CHUNK_AUTO_RELOAD_KEY);
    } catch {
      /* ignore */
    }
  }, delayMs);
  return () => window.clearTimeout(id);
}
