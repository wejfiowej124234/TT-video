/** 信任三柱 Chip 图标（PH1-UI-45） */
export function TrustChipIcon({ kind }: { kind: "escrow" | "governance" | "compliance" }) {
  const common = "h-3.5 w-3.5 shrink-0";
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
        <circle cx="8" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3 13c0-2.8 2.2-4 5-4s5 1.2 5 4" stroke="currentColor" strokeWidth="1.2" />
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
