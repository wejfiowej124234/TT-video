/** Console L5 · 节内加载骨架（与 `loading.tsx` 同族 pulse） */
export function MeOnboardingSectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-2" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 w-full rounded-[var(--radius-sm)] bg-ink-100 animate-pulse" />
      ))}
    </div>
  );
}
