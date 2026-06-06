"use client";

import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

export interface CommunityFeedMainPostFilterAlertsProps {
  t: (key: string) => string;
  meCollectsLoadError: string | null;
  retryMeCollectsLoad: () => void;
  pullY: number;
}

export default function CommunityFeedMainPostFilterAlerts({
  t,
  meCollectsLoadError,
  retryMeCollectsLoad,
  pullY,
}: CommunityFeedMainPostFilterAlertsProps) {
  return (
    <>
      {meCollectsLoadError != null && (
        <div className="mb-4 space-y-2" role="alert" aria-live="polite">
          <ApiErrorAlert message={meCollectsLoadError} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              retryMeCollectsLoad();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      )}

      {pullY > 0 && (
        <div
          className="md:hidden flex items-center justify-center text-meta text-ref-sun/90 transition-opacity"
          style={{ height: Math.min(pullY, 56) }}
          role="status"
          aria-live="polite"
          aria-label={pullY > 50 ? t("community_release_to_refresh") : t("community_pull_to_refresh")}
        >
          {pullY > 50 ? t("community_release_to_refresh") : t("community_pull_to_refresh")}
        </div>
      )}
    </>
  );
}
