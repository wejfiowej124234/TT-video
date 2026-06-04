"use client";

/** 列表页统一 loading（HON-03 · role=status）。 */
export function AdminListLoadingStatus(props: { message: string; className?: string }) {
  const { message, className } = props;

  return (
    <p
      className={className ?? "mt-6 text-body text-ink-500"}
      role="status"
      data-tt-admin-list-loading="1"
    >
      {message}
    </p>
  );
}
