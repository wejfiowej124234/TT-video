"use client";

import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

export function MeSettingsHubFlashBanner({
  message,
  onDismiss,
  dismissLabel,
}: {
  message: string;
  onDismiss: () => void;
  dismissLabel: string;
}) {
  return (
    <div
      className="rounded-xl border border-success/35 bg-success/10 px-4 py-3 text-small text-success"
      role="status"
      data-tt-me-settings-flash-banner="1"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className={`shrink-0 text-meta font-semibold text-ref-sun/85 underline underline-offset-2 ${authL5InlineLinkFocusClasses}`}
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}
