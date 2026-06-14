"use client";



import Link from "next/link";

import GuideCard from "@/components/market/GuideCard";

import { FOCUS_RING } from "@/components/me/constants";

import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";

import {

  guideProfileMissingPublicTitle,

  guideProfileSummaryHasContent,

  guideProfileToMarketPreviewDraft,

  guidePublicDetailHref,
  guidePublicMarketBrowseHref,
} from "@/lib/guide/guideWorkbenchProfileSummaryModel";
import { guideProfileSettingsHrefFromWorkbench } from "@/lib/guide/guideProfileSettingsNav";

import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";



export type GuideWorkbenchProfileSummaryCardProps = {

  t: (key: string, vars?: Record<string, string | number>) => string;

  profile: MeGuideProfile | null;

  loading: boolean;

  error: string | null;

  onRetry: () => void;

};



/** 向导工作台：只读市场挂牌预览 + 链至 settings / 公开市场（① · L5 · 无重复 dl） */

export default function GuideWorkbenchProfileSummaryCard({

  t,

  profile,

  loading,

  error,

  onRetry,

}: GuideWorkbenchProfileSummaryCardProps) {

  const publicHref = guidePublicDetailHref(profile);
  const marketBrowseHref = guidePublicMarketBrowseHref(profile);

  const hasContent = guideProfileSummaryHasContent(profile);

  const missingPublicTitle = guideProfileMissingPublicTitle(profile);

  const preview = profile ? guideProfileToMarketPreviewDraft(profile) : null;



  return (

    <section
      id="guide-workbench-profile-summary"
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1`}
      aria-label={t("guide_workbench_profile_summary_aria")}
      data-tt-guide-workbench-profile-summary="1"
    >

      <div className="mb-3">

        <h2 className={TT_WORKSPACE_L5.sectionTitle}>{t("guide_workbench_profile_summary_title")}</h2>

        <p className={TT_WORKSPACE_L5.sectionSubtitle}>{t("guide_workbench_profile_summary_subtitle")}</p>

      </div>



      {loading ? (

        <div className="animate-pulse motion-reduce:animate-none space-y-2" aria-busy="true">

          <div className="h-4 w-48 rounded bg-ref-sun/10" />

          <div className="h-16 rounded-xl bg-ref-sun/[0.06]" />

        </div>

      ) : null}



      {!loading && error ? (

        <div className="flex flex-wrap items-center gap-3">

          <p className="text-meta text-danger" role="alert">

            {error}

          </p>

          <button type="button" className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`} onClick={() => void onRetry()}>

            {t("common_retry")}

          </button>

        </div>

      ) : null}



      {!loading && !error && profile && !hasContent ? (

        <p className="text-meta text-slate-400">{t("guide_workbench_profile_summary_empty")}</p>

      ) : null}



      {!loading && !error && preview && hasContent ? (

        <div className="mb-4 max-w-sm" data-tt-guide-workbench-profile-preview="1">

          <GuideCard guide={preview} glass previewOnly />

        </div>

      ) : null}



      {!loading && !error && missingPublicTitle && profile ? (

        <p

          className="text-meta text-slate-400 mb-3"

          data-tt-guide-workbench-profile-public-title-hint="1"

        >

          {t("guide_workbench_profile_public_title_hint", {

            city: profile.city?.trim() || t("guide_card_guide"),

          })}

        </p>

      ) : null}



      <div className="flex flex-wrap gap-2">

        <Link
          href={guideProfileSettingsHrefFromWorkbench()}
          className={`${TT_WORKSPACE_L5.primaryBtn} ${FOCUS_RING}`}
          data-tt-guide-workbench-profile-edit="1"
        >
          {t("guide_workbench_profile_summary_edit")}
        </Link>
        {publicHref ? (
          <Link href={publicHref} className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}>
            {t("guide_workbench_profile_summary_market_preview")}
          </Link>
        ) : profile?.public_detail_available === false ? (
          <Link href={marketBrowseHref} className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}>
            {t("guide_workbench_profile_summary_market_browse")}
          </Link>
        ) : null}
      </div>
      {!loading && !error && profile?.public_detail_available === false ? (
        <p className="mt-3 text-meta text-slate-500/95" data-tt-guide-workbench-profile-public-unavailable-hint="1">
          {t("guide_workbench_profile_public_detail_unavailable_hint")}
        </p>
      ) : null}

    </section>

  );

}

