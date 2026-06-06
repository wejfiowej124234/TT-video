"use client";

import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";



import Link from "next/link";

import { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useTranslation } from "@/components/LocaleProvider";

import { getMeActivity } from "@/lib/apiClient/community";

import { mapApiReadError } from "@/lib/mapApiReadError";

import { useCommunityAuth } from "@/components/community/CommunityAuthContext";

import {
  CommunityInteractionSummary,
  type CommunityActivityEventItem,
} from "@/components/community/CommunityInteractionSummary";

import {

  communityCyanPillFocus,

  communitySlatePillFocus,

} from "@/lib/communityA11yFocus";

import { scheduleCommunityIdleWork } from "@/lib/communityConversationsQuery";

import { communityMeActivityQueryKey } from "@/lib/communityMeActivityContract";



/** 31 §2.2：活动中心——获赞汇总 + 近期互动事件（赞/评/关注） */

export default function CommunityActivityPage() {

  const { t } = useTranslation();

  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();

  const [deferActivityFetch, setDeferActivityFetch] = useState(false);



  useEffect(() => {

    if (!isLoggedIn || authPending) {

      setDeferActivityFetch(false);

      return;

    }

    return scheduleCommunityIdleWork(() => setDeferActivityFetch(true));

  }, [isLoggedIn, authPending]);



  const activityQ = useQuery({

    queryKey: communityMeActivityQueryKey,

    queryFn: getMeActivity,

    enabled: isLoggedIn && !authPending && deferActivityFetch,

    staleTime: 60_000,

  });



  const likesReceived = Math.floor(

    Number((activityQ.data as { likes_received?: number } | undefined)?.likes_received ?? 0)

  );

  const activityItems = useMemo(

    () =>

      Array.isArray((activityQ.data as { items?: unknown } | undefined)?.items)

        ? ((activityQ.data as { items: CommunityActivityEventItem[] }).items ?? [])

        : [],

    [activityQ.data],

  );

  const activityScope =

    activityItems.length > 0 ? "activity-events-v1" : "likes-summary-v1";

  const likesErrorMessage =

    activityQ.isError && activityQ.error != null

      ? mapApiReadError(activityQ.error, t, "community_activity_likes_load_failed")

      : null;



  return (

    <main

      data-tt-community-activity-page="1"

      data-tt-community-activity-scope={activityScope}

      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"

      aria-label={t("community_activity_title")}

      aria-describedby="community-activity-scope-hint"

    >

      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">

        <div>

          <h1 className={TT_COMMUNITY_PAGE_L5.pageTitle}>

            {t("community_activity_title")}

          </h1>

          <p className="text-small text-slate-300 mt-0.5 max-w-prose">{t("community_activity_desc")}</p>

          <p id="community-activity-scope-hint" className="sr-only">

            {t("community_activity_scope_sr_hint")}

          </p>

        </div>

        <Link

          href="/community/messages"

          className={`shrink-0 rounded-full border border-slate-500/60 bg-slate-800/70 px-3 py-2 text-meta text-slate-300 hover:border-ref-sun/35 hover:text-ref-coral motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}

        >

          {t("community_activity_back_messages")}

        </Link>

      </header>



      <CommunityInteractionSummary

        t={t}

        loginReturnPath="/community/activity"

        variant="activity"

        isLoggedIn={isLoggedIn}

        authPending={authPending}

        likesReceived={likesReceived}

        likesLoading={activityQ.isLoading || activityQ.isFetching}

        likesError={activityQ.isError}

        likesErrorMessage={likesErrorMessage}

        onRetryLikes={() => void activityQ.refetch()}

        activityItems={activityItems}

        activityLoading={activityQ.isLoading || activityQ.isFetching}

        activityError={activityQ.isError}

        activityErrorMessage={likesErrorMessage}

        onRetryActivity={() => void activityQ.refetch()}

      />



      <div className="mt-8 flex flex-wrap justify-center gap-3 [content-visibility:auto]">

        <Link

          href="/community"

          className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}

        >

          {t("community_activity_cta_feed")}

        </Link>

        <Link

          href="/community/explore"

          className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}

        >

          {t("community_explore_title")}

        </Link>

        <Link

          href="/community/messages?tab=activity"

          className={`rounded-full border border-slate-500/60 bg-slate-800/70 px-5 py-2.5 text-meta text-slate-300 hover:border-ref-sun/30 hover:text-ref-sun/95 motion-sub inline-flex items-center justify-center min-h-[44px] ${communitySlatePillFocus}`}

        >

          {t("community_messages_tab_activity")}

        </Link>

      </div>



      <p className="text-meta text-slate-400 text-center mt-6">{t("community_more_coming")}</p>

    </main>

  );

}

