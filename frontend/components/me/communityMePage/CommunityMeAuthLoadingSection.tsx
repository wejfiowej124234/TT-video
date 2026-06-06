"use client";

import { TT_COMMUNITY_ME_PANEL_L5 } from "@/lib/marketingUi";

export default function CommunityMeAuthLoadingSection({ t }: { t: (key: string) => string }) {
  return (
    <section
      aria-busy="true"
      aria-label={t("me_loading")}
      className={TT_COMMUNITY_ME_PANEL_L5.authLoadingShell}
    >
      <div className="h-11 w-full max-w-md mx-auto rounded-[var(--radius-sm)] bg-ink-700/50 animate-pulse motion-reduce:animate-none" />
    </section>
  );
}
