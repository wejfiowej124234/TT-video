"use client";

import { communityCardLinkFocus } from "@/lib/communityA11yFocus";

export default function CommunityMeLikesEnvDisabledBanner({
  t,
  onDismiss,
}: {
  t: (key: string) => string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="rounded-[var(--radius-md)] border border-warning/40 bg-warning/35 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ring-1 ring-warning/15"
    >
      <p className="text-meta text-white/95 leading-snug">{t("community_me_likes_list_disabled_by_config")}</p>
      <button
        type="button"
        onClick={onDismiss}
        className={`inline-flex self-start sm:self-center shrink-0 min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-warning/45 bg-warning/40 px-3 py-2 text-meta font-medium text-white transition-colors hover:bg-warning/60 motion-sub motion-reduce:transition-none ${communityCardLinkFocus}`}
      >
        {t("common_close")}
      </button>
    </div>
  );
}
