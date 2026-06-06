"use client";



import Link from "next/link";

import {

  communityCardLinkFocus,

  communityHeaderInlineFocus,

} from "@/lib/communityA11yFocus";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { COMMUNITY_ME_REPORTS_LIST_API_MAX } from "@/lib/apiClient/community/constants";

import CommunityMeDataStateSurface from "@/components/me/CommunityMeDataStateSurface";

import { CommunityMeListLoadMoreButton } from "@/components/me/communityMeNotes/CommunityMeListLoadMoreButton";

import {

  communityReportReasonLabel,

  communityReportStatusLabel,

  communityReportTargetTypeLabel,

} from "@/lib/communityReportLabels";

import { MeReportsEmptyPanel } from "./MeReportsEmptyPanel";

import type { CommunityMeReportsPageViewModel } from "./useCommunityMeReportsPage";



export function CommunityMeReportsPageMain({ vm }: { vm: CommunityMeReportsPageViewModel }) {

  const {

    t,

    reportsListState,

    reload,

    reportsListTruncated,

    reportsHasMore,

    reportsLoadMoreBusy,

    loadMoreReports,

  } = vm;



  return (

    <main

      data-tt-community-me-reports-page="1"

      className="max-w-lg mx-auto px-4 py-6 pb-24 safe-area-pb"

      aria-label={t("community_me_my_reports")}

    >

      <header className="mb-6 flex items-center gap-3">

        <Link

          href="/me/settings/profile"

          className={`${touchTargetLink44Classes} text-meta text-slate-300 hover:text-ref-coral motion-sub motion-reduce:transition-none ${communityHeaderInlineFocus}`}

        >

          {t("community_back")}

        </Link>

        <h1 className="text-h4 font-semibold text-ref-sun/90 flex-1">{t("community_me_my_reports")}</h1>

      </header>



      <p className="text-meta text-slate-400 mb-4">{t("community_report_list_hint")}</p>



      {reportsListTruncated && !reportsHasMore ? (

        <p

          className="mb-4 rounded-[var(--radius-md)] border border-warning/35 bg-warning/20 px-3 py-2 text-meta text-slate-200"

          role="status"

        >

          {t("community_me_reports_list_truncated_hint", { max: String(COMMUNITY_ME_REPORTS_LIST_API_MAX) })}

        </p>

      ) : null}



      <CommunityMeDataStateSurface

        state={reportsListState}

        t={t}

        analyticsSurface="community_me_reports_list"

        onRetry={() => void reload()}

        loadingSlot={

          <ul

            className="m-0 list-none space-y-3 p-0"

            aria-busy="true"

            aria-label={t("community_me_my_reports")}

          >

            {[0, 1, 2].map((i) => (

              <li

                key={i}

                className="min-h-[5.5rem] rounded-[var(--radius-md)] border border-ref-sun/15 bg-ink-700/40 animate-pulse motion-reduce:animate-none"

              />

            ))}

          </ul>

        }

        emptySlot={<MeReportsEmptyPanel t={t} />}

        success={(rows) => (

          <>

            <ul className="space-y-3" role="list">

              {rows.map((row) => (

                <li key={row.id}>

                  <Link

                    href={`/community/me/reports/${encodeURIComponent(row.id)}`}

                    className={`flex w-full min-h-[44px] flex-col justify-center rounded-[var(--radius-md)] border border-slate-600/60 bg-ink-800/70 p-4 hover:border-ref-sun/30 motion-sub motion-reduce:transition-none ${communityCardLinkFocus}`}

                  >

                    <div className="flex items-start justify-between gap-2">

                      <div className="min-w-0">

                        <p className="text-small font-medium text-slate-200 truncate">

                          {communityReportStatusLabel(t, row.status)}

                        </p>

                        <p className="text-meta text-slate-400 mt-1">

                          {communityReportReasonLabel(t, row.reason_code)}

                        </p>

                        <p className="text-meta text-slate-400 mt-1">

                          {communityReportTargetTypeLabel(t, row.target_type)} ·{" "}

                          <span className="font-mono text-slate-300 break-all">{row.target_id}</span>

                        </p>

                        <p className="text-meta text-slate-400 mt-1">

                          {t("community_report_list_submitted_at")}{" "}

                          <time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString()}</time>

                        </p>

                      </div>

                      <span className="text-meta text-ref-sun shrink-0">

                        {t("community_report_view_ticket")}

                        {t("ui_link_nav_arrow_suffix")}

                      </span>

                    </div>

                  </Link>

                </li>

              ))}

            </ul>

            {reportsHasMore ? (

              <CommunityMeListLoadMoreButton

                t={t}

                busy={reportsLoadMoreBusy}

                onClick={loadMoreReports}

                surface="page"

              />

            ) : null}

          </>

        )}

      />

    </main>

  );

}


