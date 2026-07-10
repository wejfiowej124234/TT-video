"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchGuideAvailabilityCached } from "@/lib/guideAvailabilityClient";
import { parseOccupiedRanges } from "@/lib/guidesAvailableForTrip";
import { countGuideOccupiedDaysThisMonth } from "@/lib/guide/guideWorkbenchAvailabilityModel";
import { guidePublicDetailHref, guidePublicMarketBrowseHref } from "@/lib/guide/guideWorkbenchProfileSummaryModel";
import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { FOCUS_RING } from "@/components/me/constants";
import {
  GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER,
} from "@/lib/guide/guideWorkbenchL5ClosureSprintModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GuideWorkbenchAvailabilityCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  profile: MeGuideProfile | null;
};

/** 向导工作台：只读档期摘要 + 链至公开市场完整日历（① · L5） */
export default function GuideWorkbenchAvailabilityCard({ t, profile }: GuideWorkbenchAvailabilityCardProps) {
  const guideId = profile?.guide_id?.trim() ?? "";
  const publicHref = guidePublicDetailHref(profile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [occupiedThisMonth, setOccupiedThisMonth] = useState<number | null>(null);

  useEffect(() => {
    if (!guideId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchGuideAvailabilityCached(guideId)
      .then((payload) => {
        if (cancelled) return;
        const ranges = parseOccupiedRanges(payload?.occupied_ranges);
        setOccupiedThisMonth(countGuideOccupiedDaysThisMonth(ranges).occupied);
      })
      .catch(() => {
        if (cancelled) return;
        setError(t("guide_workbench_availability_load_fail"));
        setOccupiedThisMonth(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [guideId, t]);

  if (!guideId) return null;

  return (
    <section
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1`}
      aria-label={t("guide_workbench_availability_aria")}
      data-tt-guide-workbench-availability="1"
      data-tt-guide-workbench-l5-closure={GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE}
      data-tt-ui-frozen={GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER}
    >
      <div className="mb-3">
        <h2 className={TT_WORKSPACE_L5.sectionTitle}>{t("guide_workbench_availability_title")}</h2>
        <p className={TT_WORKSPACE_L5.sectionSubtitle}>{t("guide_workbench_availability_subtitle")}</p>
      </div>

      {loading ? (
        <p className="text-meta text-slate-400" role="status">
          {t("guide_workbench_inbox_syncing")}
        </p>
      ) : null}

      {error ? (
        <div className="mb-3">
          <ApiErrorAlert message={error} />
        </div>
      ) : null}

      {!loading && !error && occupiedThisMonth != null ? (
        <p className="text-body text-slate-200 mb-3">
          {t("guide_workbench_availability_occupied_month", { count: occupiedThisMonth })}
        </p>
      ) : null}

      {publicHref ? (
        <Link href={`${publicHref}#guide-availability`} className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}>
          {t("guide_workbench_availability_view_public")}
        </Link>
      ) : profile?.public_detail_available === false ? (
        <Link href={guidePublicMarketBrowseHref(profile)} className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}>
          {t("guide_workbench_profile_summary_market_browse")}
        </Link>
      ) : null}
    </section>
  );
}
