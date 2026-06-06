"use client";

/**
 * 统一「主按钮灰显 / 不可发布」时的可读说明（社区 / 市场玻璃弹窗 footer）。
 */
export function ActionGateChecklist({
  itemKeys,
  t,
  variant,
  titleKey,
  className,
  id,
}: {
  itemKeys: readonly string[];
  t: (key: string) => string;
  variant: "community" | "communityInline" | "marketFooter" | "itinModal" | "consoleInline";
  titleKey?: string;
  className?: string;
  id?: string;
}) {
  if (itemKeys.length === 0) return null;
  if (variant === "communityInline") {
    return (
      <p id={id} role="status" className={`mb-2 text-meta text-slate-400/95 ${className ?? ""}`}>
        {t(itemKeys[0]!)}
      </p>
    );
  }
  const shell =
    variant === "community"
      ? "rounded-[var(--radius-md)] border border-warning/35 bg-warning/10 px-3 py-2.5 mb-3 text-left"
      : variant === "itinModal"
        ? "rounded-[var(--radius-md)] border border-white/20 bg-white/[0.06] px-3 py-2.5 mb-2 text-left"
        : variant === "consoleInline"
          ? "rounded-[var(--radius-md)] border border-ink-200/90 bg-bg-soft px-3 py-2.5 mb-3 text-left"
          : "border-b border-warning/25 bg-warning/[0.07] px-4 py-2.5 sm:px-6";
  const text =
    variant === "community"
      ? "text-meta text-slate-100/95"
      : variant === "itinModal"
        ? "text-meta text-white/90"
        : variant === "consoleInline"
          ? "text-meta text-ink-800"
          : "text-[0.7rem] leading-snug text-white/95";
  return (
    <div id={id} role="status" className={`${shell} ${className ?? ""}`}>
      {titleKey ? <p className={`font-semibold mb-1.5 ${text}`}>{t(titleKey)}</p> : null}
      <ul className={`list-disc space-y-0.5 pl-4 m-0 ${text}`}>
        {itemKeys.map((k) => (
          <li key={k}>{t(k)}</li>
        ))}
      </ul>
    </div>
  );
}
