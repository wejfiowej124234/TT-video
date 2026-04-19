"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import {
  getMeFollowing,
  getMeFollowers,
  getFriendsList,
  getMeCollects,
  getMeLikesReceived,
} from "@/lib/apiClient/community";
import { getMe } from "@/lib/apiClient/me";
import MeTrustSection from "@/components/me/MeTrustSection";
import CommunityMeAccountPanel from "@/components/me/CommunityMeAccountPanel";
import CommunityMeAccountSecurityRow from "@/components/me/CommunityMeAccountSecurityRow";
import { parseIdentitySlotsFromMe } from "@/lib/meIdentitySlots";
import MePageFooter from "@/components/me/MePageFooter";
import { parseMeTrustFromMeResponse, userFromGetMePayload } from "@/lib/meTrust";
import { userIsGuide } from "@/lib/meRoleDisplay";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import {
  communityMeCollectsPathActive,
  communityMeContentSegmentClass,
  communityMePostsPathActive,
} from "@/lib/communityMeContentNav";

const STATS_STALE_MS = 60_000;

/** 31 附录 / 51-31-19：潮流社区 · 我的；统计优先 API + React Query 缓存（52 §7.5 P1） */
export default function CommunityMePage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isLoggedIn, isLoading: authLoading } = useCommunityAuth();

  const [a, b, c, d, likesQ, meQ] = useQueries({
    queries: [
      { queryKey: ["community", "meFollowing"], queryFn: getMeFollowing, staleTime: STATS_STALE_MS },
      { queryKey: ["community", "meFollowers"], queryFn: getMeFollowers, staleTime: STATS_STALE_MS },
      { queryKey: ["community", "friendsList"], queryFn: getFriendsList, staleTime: STATS_STALE_MS },
      { queryKey: ["community", "meCollects"], queryFn: getMeCollects, staleTime: STATS_STALE_MS },
      {
        queryKey: ["community", "meLikesReceived"],
        queryFn: async () => (await getMeLikesReceived()) ?? { status: "ok", likes_received: 0 },
        staleTime: STATS_STALE_MS,
      },
      { queryKey: ["community", "meProfile"], queryFn: getMe, staleTime: STATS_STALE_MS },
    ],
  });

  const statsLoading = a.isLoading || b.isLoading || c.isLoading || d.isLoading || likesQ.isLoading;
  const apiStats =
    a.data != null && b.data != null && c.data != null && d.data != null
      ? {
          following: a.data.following?.length ?? 0,
          followers: b.data.followers?.length ?? 0,
          friends: c.data.friends?.length ?? 0,
          collects: d.data.collects?.length ?? 0,
        }
      : null;

  const followingCount = apiStats?.following ?? 0;
  const followersCount = apiStats?.followers ?? 0;
  const friendsCount = apiStats?.friends ?? 0;
  const likesReceived = Math.max(
    0,
    Math.floor(Number((likesQ.data as { likes_received?: number } | undefined)?.likes_received ?? 0))
  );

  const meUser = userFromGetMePayload(meQ.data);
  const showMeSections = isLoggedIn && !authLoading;
  const guestPostsActive = communityMePostsPathActive(pathname);
  const guestCollectsActive = communityMeCollectsPathActive(pathname);

  return (
    <main
      className="max-w-3xl mx-auto px-3 py-3 sm:px-4 sm:py-4 pb-24 safe-area-pb text-slate-200 space-y-3"
      aria-label={t("me_title")}
    >
      {!isLoggedIn && !authLoading ? (
        <section className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md px-4 py-5 text-center ring-1 ring-white/5">
          <p className="text-meta sm:text-body text-slate-300 mb-3 leading-snug">{t("community_me_login_prompt")}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent("/community/me")}`}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-5 py-2.5 text-meta font-medium text-cyan-200 hover:bg-cyan-500/30 ${communityCardLinkFocus}`}
          >
            {t("me_goLogin")}
          </Link>
        </section>
      ) : null}

      <CommunityMeAccountPanel
        t={t}
        enabled={isLoggedIn && !authLoading}
        compactVertical={showMeSections}
        communityStats={{
          statsLoading,
          followingCount,
          followersCount,
          friendsCount,
          likesReceived,
        }}
      />

      {meUser ? (
        <div className="space-y-2.5">
          <MeTrustSection
            t={t}
            trust={parseMeTrustFromMeResponse(meQ.data, meUser)}
            showGuideRegisterLink={!userIsGuide(meUser)}
            showTrustHubPromo={false}
            identitySlots={parseIdentitySlotsFromMe(meQ.data)}
            compact
          />
          <CommunityMeAccountSecurityRow />
        </div>
      ) : null}

      {!showMeSections ? (
        <nav
          className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md overflow-hidden ring-1 ring-white/5 p-0.5"
          aria-label={t("community_me_notes_tablist_aria")}
          title={t("community_me_notes_tab_hint")}
        >
          <ul className="grid grid-cols-3 list-none p-0 m-0 gap-0.5 text-center">
            <li className="min-w-0">
              <Link
                href="/community/me/posts"
                className={communityMeContentSegmentClass(guestPostsActive)}
                aria-current={guestPostsActive ? "page" : undefined}
              >
                {t("community_me_tab_notes")}
              </Link>
            </li>
            <li className="min-w-0">
              <Link
                href="/community/me/collects"
                className={communityMeContentSegmentClass(guestCollectsActive)}
                aria-current={guestCollectsActive ? "page" : undefined}
              >
                {t("community_me_tab_collects")}
              </Link>
            </li>
            <li className="min-w-0">
              <span
                className="flex min-h-[44px] cursor-not-allowed items-center justify-center px-2 py-2 text-meta text-slate-500/90 line-clamp-2 leading-tight"
                aria-disabled="true"
                title={t("community_me_liked_empty")}
              >
                {t("community_me_tab_liked")}
              </span>
            </li>
          </ul>
        </nav>
      ) : null}

      <p
        className={`text-[0.7rem] text-slate-500 text-center leading-snug ${showMeSections ? "pt-0.5" : ""}`}
      >
        {t("community_more_coming")}
      </p>

      <MePageFooter t={t} variant="compact" />
    </main>
  );
}
