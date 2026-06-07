"use client";

/** 列表页统一 loading（HON-03 · role=status）。 */
export function AdminListLoadingStatus(props: {
  message: string;
  hint?: string;
  className?: string;
}) {
  const { message, hint, className } = props;

  return (
    <div
      className={className ?? "mt-6 space-y-1.5"}
      role="status"
      aria-live="polite"
      data-tt-admin-list-loading="1"
    >
      <p className="text-body text-ink-500">{message}</p>
      {hint ? <p className="text-small text-ink-500">{hint}</p> : null}
    </div>
  );
}
