"use client";

export function CommunityFeedbackToast({
  toastKey,
  t,
}: {
  toastKey: string | null;
  t: (key: string) => string;
}) {
  if (!toastKey) return null;
  return (
    <div
      className={`fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,22rem)] rounded-[var(--radius-md)] border px-4 py-3 text-small shadow-medium backdrop-blur safe-area-pb ${
        toastKey === "community_feedback_offline_saved"
          ? "border-warning/50 bg-ink-900/95 text-warning/95"
          : "border-ref-sun/35 bg-ink-900/95 text-ref-sun/90"
      }`}
      role="status"
      aria-live="polite"
    >
      {t(toastKey)}
    </div>
  );
}
