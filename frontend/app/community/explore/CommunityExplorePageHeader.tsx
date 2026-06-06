"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communitySlatePillFocus,
  communityWarningPillFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import type { CommunityExplorePageViewModel } from "./useCommunityExplorePage";

export function CommunityExplorePageHeader(vm: CommunityExplorePageViewModel) {
  const { t, exploreFeedDegradedBanner, exploreFeedContractInvalid, feedRefetch, showScanEntryHint } = vm;

  return (
    <>
      <header className={TT_COMMUNITY_PAGE_L5.pageHeader}>
        <h1 className={TT_COMMUNITY_PAGE_L5.pageTitle}>
          {t("community_explore_title")}
        </h1>
        <p className="text-small text-slate-300 mt-1">{t("community_explore_subtitle")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/community"
            className={`${TT_COMMUNITY_PAGE_L5.pill} motion-reduce:transition-none ${communityCyanPillFocus}`}
          >
            {t("community_explore_open_feed")}
          </Link>
          <Link
            href="/terms/community-guidelines"
            className={`${TT_COMMUNITY_FEED_ACTION.headerPillGhost} motion-reduce:transition-none ${communitySlatePillFocus}`}
          >
            {t("community_guidelines")}
          </Link>
          <Link
            href="/community/me/reports"
            title={t("community_explore_reports_link_hint")}
            className={`rounded-full border border-white/35 bg-warning/20 px-4 py-2 text-meta font-medium text-white hover:bg-warning/30 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityWarningPillFocus}`}
          >
            {t("community_me_my_reports")}
          </Link>
        </div>
      </header>

      {showScanEntryHint ? (
        <div
          className="mb-4 rounded-[var(--radius-md)] border border-ref-sun/22 bg-ink-900/60 px-4 py-3 text-meta text-slate-400"
          role="status"
          data-testid="community-explore-scan-entry-hint"
        >
          {t("community_discovery_scan_explore_banner")}
        </div>
      ) : null}

      {exploreFeedDegradedBanner ? (
        <div className="mb-4" role="status" aria-live="polite">
          <ApiErrorAlert message={exploreFeedDegradedBanner} tone="dark" />
        </div>
      ) : null}

      {exploreFeedContractInvalid ? (
        <div className="mb-4 space-y-2" role="alert" aria-live="polite">
          <ApiErrorAlert message={t("api_list_items_contract_error")} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              feedRefetch();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`${TT_COMMUNITY_FEED_ACTION.retryPill} motion-reduce:transition-none ${communityCardLinkFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
