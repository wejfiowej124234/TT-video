/** 信任三柱 Chip 图标（PH1-UI-45） */
export function TrustChipIcon({
  kind,
  className,
}: {
  kind: "escrow" | "governance" | "compliance" | "destination";
  className?: string;
}) {
  const common = className ?? "h-3.5 w-3.5 shrink-0";
  if (kind === "escrow") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 1.5 3 4v4c0 3 2.2 5.8 5 6.5 2.8-.7 5-3.5 5-6.5V4L8 1.5Z" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (kind === "governance") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 2.5v2.5M4.5 6.5h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M5.5 6.5 4 13h2.5M10.5 6.5 12 13H9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6.5v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "destination") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M8 1.75a4.25 4.25 0 0 0-4.25 4.25c0 3.1 4.25 8.25 4.25 8.25S12.25 9.1 12.25 6A4.25 4.25 0 0 0 8 1.75Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <circle cx="8" cy="6" r="1.35" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 2h8v12H4V2Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
