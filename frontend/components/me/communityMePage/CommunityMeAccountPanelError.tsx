"use client";

import { type FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { FOCUS_RING } from "@/components/me/constants";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import type { CommunityMeAccountPanelTFunc } from "@/components/me/communityMePage/communityMeAccountPanelUtils";

export default function CommunityMeAccountPanelError({
  message,
  onRetry,
  t,
}: {
  message: string;
  onRetry: () => void;
  t: CommunityMeAccountPanelTFunc;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-slate-600/55 bg-ink-900/65 px-4 py-4 space-y-3 shadow-scifi-panel ring-1 ring-white/5">
      <ApiErrorAlert message={message} />
      <form
        className="inline"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onRetry();
        }}
      >
        <button
          type="submit"
          className={`${TT_COMMUNITY_PAGE_L5.pill} motion-sub ${FOCUS_RING}`}
        >
          {t("common_retry")}
        </button>
      </form>
    </div>
  );
}
