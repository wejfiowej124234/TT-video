"use client";



import Link from "next/link";

import { useMemo } from "react";

import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";

import PublishHubItemCard from "@/components/me/publish/PublishHubItemCard";

import type { MeIdentitySlotState } from "@/lib/meIdentitySlots";

import { FOCUS_RING } from "@/components/me/constants";

import { mapPublishHubGuideItem } from "@/lib/me/publishHubItemMappers";

import { TT_PUBLISH_HUB_L5 } from "@/lib/me/publishHubL5";

import { GUIDE_WORKSPACE_HREF } from "@/lib/workspace/workspaceIdentityModel";



const GUIDE_SETTINGS_HREF = "/me/identities/guide/settings";



export default function PublishHubGuideRailSection({

  t,

  unlocked,

  slotState,

  profile,

  loading,

  error,

  onRetry,

}: {

  t: (key: string) => string;

  unlocked: boolean;

  slotState: MeIdentitySlotState | null;

  profile: MeGuideProfile | null;

  loading: boolean;

  error: string | null;

  onRetry: () => void;

}) {

  const item = useMemo(

    () =>

      mapPublishHubGuideItem({

        profile,

        slotState,

        t,

        settingsHref: GUIDE_SETTINGS_HREF,

        editLabel: t("publish_hub_guide_edit_profile"),

      }),

    [profile, slotState, t],

  );



  return (

    <section

      className={TT_PUBLISH_HUB_L5.railSection}

      aria-labelledby="publish-hub-rail-guide"

      data-tt-publish-hub-rail="guide"

      data-tt-publish-hub-rail-phase={unlocked ? "active" : "locked"}

    >

      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">

        <div>

          <h2 id="publish-hub-rail-guide" className={TT_PUBLISH_HUB_L5.railTitle}>

            {t("publish_hub_rail_guide_title")}

          </h2>

          <p className={TT_PUBLISH_HUB_L5.railSubtitle}>{t("publish_hub_rail_guide_subtitle")}</p>

        </div>

        {unlocked ? (

          <Link

            href={GUIDE_WORKSPACE_HREF}

            className={`${TT_PUBLISH_HUB_L5.crossNavLink} ${FOCUS_RING}`}

            data-tt-publish-hub-guide-workbench="1"

          >

            {t("publish_hub_guide_open_workbench")}

          </Link>

        ) : null}

      </div>



      {!unlocked ? (

        <div className={TT_PUBLISH_HUB_L5.railPlaceholder}>

          <p className="text-meta text-slate-400/95">{t("publish_hub_guide_locked_body")}</p>

          <Link

            href="/guide/register"

            className={`mt-4 inline-flex min-h-[44px] items-center text-small font-semibold text-ref-sun/90 ${FOCUS_RING}`}

            data-tt-publish-hub-guide-apply="1"

          >

            {t("publish_hub_guide_apply_cta")}

          </Link>

        </div>

      ) : (

        <>

          {loading ? (

            <p className="text-meta text-slate-400/95">{t("publish_hub_guide_loading")}</p>

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

            <div data-tt-publish-hub-guide-status="1">

              <PublishHubItemCard item={item} coverAlt={t("publish_hub_item_cover_alt")} />

              {!profile?.guide_id ? (

                <div className="mt-3">

                  <Link

                    href="/guide/register"

                    className={`${TT_PUBLISH_HUB_L5.crossNavLink} ${FOCUS_RING}`}

                    data-tt-publish-hub-guide-register="1"

                  >

                    {t("publish_hub_guide_apply_cta")}

                  </Link>

                </div>

              ) : null}

            </div>

          ) : null}

        </>

      )}

    </section>

  );

}


