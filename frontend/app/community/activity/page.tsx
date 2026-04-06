"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import { getMeLikesReceived } from "@/lib/apiClient/community";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { CommunityInteractionSummary } from "@/components/community/CommunityInteractionSummary";
import {
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";

/** 31 §2.2：活动中心——已对接获赞汇总；逐条通知仍待后端 */
export default function CommunityActivityPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();

  const likesQ = useQuery({
    queryKey: ["community", "likes-received"],
    queryFn: async () => (await getMeLikesReceived()) ?? { status: "ok", likes_received: 0 },
    enabled: isLoggedIn && !authPending,
    staleTime: 60_000,
  });
  const likesReceived = Math.floor(
    Number((likesQ.data as { likes_received?: number } | undefined)?.likes_received ?? 0)
  );
  const likesErrorMessage =
    likesQ.isError && likesQ.error != null
      ? mapApiReadError(likesQ.error, t, "community_activity_likes_load_failed")
      : null;

  return (
    <main className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb" aria-label={t("community_activity_title")}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h3 font-bold bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
            {t("community_activity_title")}
          </h1>
          <p className="text-small text-slate-300 mt-0.5 max-w-prose">{t("community_activity_desc")}</p>
        </div>
        <Link
          href="/community/messages"
          className={`shrink-0 rounded-full border border-slate-500/60 bg-slate-800/70 px-3 py-2 text-meta text-slate-300 hover:border-cyan-500/50 hover:text-cyan-100 motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
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
        likesLoading={likesQ.isLoading || likesQ.isFetching}
        likesError={likesQ.isError}
        likesErrorMessage={likesErrorMessage}
        onRetryLikes={() => void likesQ.refetch()}
      />

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/community"
          className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-5 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityCyanPillFocus}`}
        >
          {t("community_activity_cta_feed")}
        </Link>
        <Link
          href="/community/explore"
          className={`rounded-full border border-fuchsia-400/45 bg-fuchsia-500/15 px-5 py-2.5 text-meta font-medium text-fuchsia-100 hover:bg-fuchsia-500/25 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityFuchsiaPillFocus}`}
        >
          {t("community_explore_title")}
        </Link>
        <Link
          href="/community/messages?tab=activity"
          className={`rounded-full border border-slate-500/60 bg-slate-800/70 px-5 py-2.5 text-meta text-slate-300 hover:border-fuchsia-500/40 hover:text-fuchsia-100 motion-sub inline-flex items-center justify-center min-h-[44px] ${communitySlatePillFocus}`}
        >
          {t("community_messages_tab_activity")}
        </Link>
      </div>

      <p className="text-meta text-slate-400 text-center mt-6">{t("community_more_coming")}</p>
    </main>
  );
}
