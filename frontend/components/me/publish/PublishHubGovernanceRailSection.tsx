"use client";



import Link from "next/link";

import { useMemo } from "react";

import type { PublishHubGovernanceProposalRow } from "@/app/me/publish/usePublishHubGovernanceRail";

import PublishHubItemList from "@/components/me/publish/PublishHubItemList";

import { FOCUS_RING } from "@/components/me/constants";

import { mapPublishHubGovernanceItems } from "@/lib/me/publishHubItemMappers";

import { TT_PUBLISH_HUB_L5 } from "@/lib/me/publishHubL5";



export default function PublishHubGovernanceRailSection({

  t,

  unlocked,

  rows,

  loading,

  error,

  onRetry,

}: {

  t: (key: string) => string;

  unlocked: boolean;

  rows: readonly PublishHubGovernanceProposalRow[];

  loading: boolean;

  error: string | null;

  onRetry: () => void;

}) {

  const items = useMemo(

    () => mapPublishHubGovernanceItems(rows, t("publish_hub_governance_open_proposal")),

    [rows, t],

  );



  return (

    <section

      className={TT_PUBLISH_HUB_L5.railSection}

      aria-labelledby="publish-hub-rail-governance"

      data-tt-publish-hub-rail="governance"

      data-tt-publish-hub-rail-phase={unlocked ? "active" : "locked"}

    >

      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">

        <div>

          <h2 id="publish-hub-rail-governance" className={TT_PUBLISH_HUB_L5.railTitle}>

            {t("publish_hub_rail_governance_title")}

          </h2>

          <p className={TT_PUBLISH_HUB_L5.railSubtitle}>{t("publish_hub_rail_governance_subtitle")}</p>

        </div>

        {unlocked ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href="/governance/proposals"
              className={`${TT_PUBLISH_HUB_L5.crossNavLink} ${FOCUS_RING}`}
              data-tt-publish-hub-governance-hub="1"
            >
              {t("publish_hub_governance_open_hub")}
            </Link>
            <Link
              href="/governance/proposals/new"
              className={`${TT_PUBLISH_HUB_L5.crossNavLink} ${FOCUS_RING}`}
              data-tt-publish-hub-governance-create="1"
            >
              {t("publish_hub_governance_create_cta")}
            </Link>
          </div>
        ) : null}

      </div>



      {!unlocked ? (

        <div className={TT_PUBLISH_HUB_L5.railPlaceholder}>

          <p className="text-meta text-slate-400/95">{t("publish_hub_governance_locked_body")}</p>

          <Link

            href="/governance"

            className={`mt-4 inline-flex min-h-[44px] items-center text-small font-semibold text-ref-sun/90 ${FOCUS_RING}`}

            data-tt-publish-hub-governance-apply="1"

          >

            {t("publish_hub_governance_apply_cta")}

          </Link>

        </div>

      ) : (

        <>

          {loading ? (

            <p className="text-meta text-slate-400/95">{t("publish_hub_governance_loading")}</p>

          ) : null}

          {error ? (

            <p className="text-meta text-danger" role="alert">

              {error}{" "}

              <button type="button" className={`text-ref-sun/90 underline ${FOCUS_RING}`} onClick={onRetry}>

                {t("common_retry")}

              </button>

            </p>

          ) : null}



          {!loading && !error ? (

            <PublishHubItemList items={items} listDataAttr="governance" coverAlt={t("publish_hub_item_cover_alt")} />

          ) : null}



          {!loading && !error && rows.length === 0 ? (

            <div className={TT_PUBLISH_HUB_L5.railPlaceholder}>

              <p className="text-meta text-slate-400/95">{t("publish_hub_governance_empty")}</p>

              <Link

                href="/governance/proposals/new"

                className={`mt-4 inline-flex min-h-[44px] items-center text-small font-semibold text-ref-sun/90 ${FOCUS_RING}`}

                data-tt-publish-hub-governance-create="1"

              >

                {t("publish_hub_governance_create_cta")}

              </Link>

            </div>

          ) : null}

        </>

      )}

    </section>

  );

}


