/** `/orders/[id]` 立即 `redirect` 至 `/escrow/[id]`；保留轻量占位避免白屏闪烁 */
export default function OrdersByIdLoading() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-bg-main" aria-busy="true">
      <div className="h-8 w-48 max-w-[60%] rounded-[var(--radius-md)] bg-ink-100 animate-pulse motion-reduce:animate-none" />
    </div>
  );
}
