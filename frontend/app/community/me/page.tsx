"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import {
  getMeFollowing,
  getMeFollowers,
  getFriendsList,
  getMeCollects,
  getFeed,
  getMeLikesReceived,
  postUserFollow,
} from "@/lib/apiClient/community";
import { getMe } from "@/lib/apiClient/me";
import MeTrustSection from "@/components/me/MeTrustSection";
import { parseMeTrustFromMeResponse, userFromGetMePayload } from "@/lib/meTrust";
import {
  communityRoleLabelI18nKey,
  communityStoredRoleLabelI18nKey,
  meProtocolRoleForDisplay,
  userIsGuide,
} from "@/lib/meRoleDisplay";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import { messageForCommunityActionResponse } from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { mapApiPostToCommunityPost } from "@/components/community/communityFeedMappers";
import { suggestedAuthorsFromPosts } from "@/components/community/communitySuggestedAuthors";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communityMeTabBarLinkFocus,
  communitySlatePillFocus,
  communityWarningPillFocus,
} from "@/lib/communityA11yFocus";

const STATS_STALE_MS = 60_000;

/** 31 附录 / 51-31-19：潮流社区 · 我的；统计优先 API + React Query 缓存（52 §7.5 P1） */
export default function CommunityMePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, isLoading: authLoading } = useCommunityAuth();
  const [suggestBusyId, setSuggestBusyId] = useState<string | null>(null);
  /** invalidate 完成前防止重复提交；卡片从推荐列表消失后由 effect 清理 */
  const [suggestFollowedOptimistic, setSuggestFollowedOptimistic] = useState<Set<string>>(() => new Set());
  const [meToast, setMeToast] = useState<string | null>(null);
  const meToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meSuggestedHeadingId = useId();
  const meQuickHeadingId = useId();

  const showMeToast = useCallback((text: string) => {
    if (meToastTimerRef.current) clearTimeout(meToastTimerRef.current);
    setMeToast(text);
    meToastTimerRef.current = setTimeout(() => {
      meToastTimerRef.current = null;
      setMeToast(null);
    }, 3200);
  }, []);

  useEffect(
    () => () => {
      if (meToastTimerRef.current) clearTimeout(meToastTimerRef.current);
    },
    []
  );

  const [a, b, c, d, likesQ, meQ, feedQ] = useQueries({
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
      { queryKey: ["community", "feedSuggest"], queryFn: () => getFeed({ limit: 40 }), staleTime: STATS_STALE_MS },
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
  const meId = meUser?.id ?? null;
  const followingIdsForSuggest = useMemo(() => {
    const raw = a.data?.following ?? [];
    return new Set(raw.map((x) => x.id));
  }, [a.data]);

  const feedPostsRaw = feedQ.data?.posts;
  const feedPostsMapped = useMemo(
    () => (feedPostsRaw ?? []).map(mapApiPostToCommunityPost),
    [feedPostsRaw]
  );
  const suggestedUsers = useMemo(
    () =>
      meId
        ? suggestedAuthorsFromPosts(feedPostsMapped, {
            meUserId: meId,
            followingAuthorIds: followingIdsForSuggest,
            max: 6,
          })
        : [],
    [feedPostsMapped, meId, followingIdsForSuggest]
  );

  useEffect(() => {
    const inList = new Set(suggestedUsers.map((u) => u.id));
    setSuggestFollowedOptimistic((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (inList.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [suggestedUsers]);

  const handleSuggestedFollow = useCallback(
    async (userId: string) => {
      if (suggestBusyId || suggestFollowedOptimistic.has(userId)) return;
      if (!isLoggedIn && !authLoading) {
        router.push(`/auth/login?returnUrl=${encodeURIComponent("/community/me")}`);
        return;
      }
      if (!isLoggedIn) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        showMeToast(t("community_interaction_offline"));
        return;
      }
      setSuggestBusyId(userId);
      try {
        const res = await postUserFollow(userId);
        const ok = res && typeof res === "object" && (res as { status?: string }).status === "ok";
        if (ok) {
          setSuggestFollowedOptimistic((s) => new Set(s).add(userId));
          void queryClient.invalidateQueries({ queryKey: ["community", "meFollowing"] });
          void queryClient.invalidateQueries({ queryKey: ["community", "feedSuggest"] });
        } else {
          showMeToast(messageForCommunityActionResponse(res, t, "community_user_follow_toggleFailed"));
        }
      } catch (err) {
        showMeToast(mapApiReadError(err, t, "community_user_follow_toggleFailed"));
      } finally {
        setSuggestBusyId(null);
      }
    },
    [suggestBusyId, suggestFollowedOptimistic, isLoggedIn, authLoading, router, showMeToast, t, queryClient]
  );

  const bio = "";
  const displayAvatarSrc =
    meUser?.avatar_url?.trim() ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80";
  const displayName = (meUser?.nickname && meUser.nickname.trim()) || meId?.slice(0, 8) || t("me_defaultDisplayName");
  const rawWallet = meUser?.default_wallet_address?.trim();
  const walletPreview =
    rawWallet && rawWallet.length > 0
      ? formatWalletOrDidShort(rawWallet) ?? rawWallet
      : t("community_did_placeholder");

  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb text-slate-200"
      aria-label={t("community_tab_me")}
    >
      {/* 资料卡：头像 + 上传入口、昵称、DID、简介、统计、编辑/设置 */}
      <header className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-slate-900/60 backdrop-blur-md px-4 py-6 mb-4 shadow-scifi-banner">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-cyan-400/50 bg-slate-800">
              <Image src={displayAvatarSrc} alt="" fill className="object-cover" sizes="80px" unoptimized />
            </div>
            <form
              className="absolute -bottom-0.5 -right-0.5"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
              }}
            >
              <button
                type="submit"
                className={`h-11 w-11 shrink-0 rounded-full border-2 border-slate-900 bg-warning flex items-center justify-center text-white hover:bg-warning/85 motion-sub ${communityWarningPillFocus}`}
                aria-label={t("community_me_change_avatar")}
                title={t("community_me_upload_avatar")}
              >
                <span className="text-body-l font-bold leading-none">+</span>
              </button>
            </form>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-h4 font-bold text-slate-100">{displayName}</h1>
            <p className="text-meta text-cyan-300 mt-0.5">
              {t(communityRoleLabelI18nKey(meProtocolRoleForDisplay(meUser ?? undefined)))}
            </p>
            <p className="text-meta text-slate-400 mt-0.5 break-all">
              {t("community_did_wallet_label")}
              {t("community_did_colon")}
              {walletPreview}
            </p>
            {bio ? (
              <p className="text-small text-slate-300 mt-2 line-clamp-2">{bio}</p>
            ) : (
              <div className="mt-2">
                <p className="text-small text-slate-400">{t("community_me_bio_empty")}</p>
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                  }}
                >
                  <button
                    type="submit"
                    className={`text-meta text-cyan-300 hover:text-cyan-100 mt-1 motion-sub underline underline-offset-2 min-h-[44px] inline-flex items-center justify-center ${communityCardLinkFocus}`}
                    aria-label={t("community_me_add_bio")}
                  >
                    {t("community_me_add_bio")}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 sm:gap-6 mt-4 pt-4 border-t border-slate-600/50 flex-wrap">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center min-w-[60px] min-h-[44px] flex flex-col justify-center gap-1" aria-hidden>
                  <span className="block h-6 w-8 rounded-[var(--radius-sm)] bg-slate-600/70 animate-pulse mx-auto" />
                  <span className="block h-3 w-12 rounded-[var(--radius-sm)] bg-slate-700/60 animate-pulse mx-auto" />
                </div>
              ))}
            </>
          ) : (
            <>
              <Link href="/community/friends?tab=following" className={`text-center min-w-[60px] min-h-[44px] flex flex-col justify-center rounded-[var(--radius-md)] ${communityCardLinkFocus}`} aria-label={`${followingCount} ${t("community_me_following")}`}>
                <span className="block text-h4 font-bold text-cyan-300">{followingCount}</span>
                <span className="text-meta text-slate-300">{t("community_me_following")}</span>
              </Link>
              <Link href="/community/friends?tab=followers" className={`text-center min-w-[60px] min-h-[44px] flex flex-col justify-center rounded-[var(--radius-md)] ${communityCardLinkFocus}`} aria-label={`${followersCount} ${t("community_me_followers")}`}>
                <span className="block text-h4 font-bold text-fuchsia-300">{followersCount}</span>
                <span className="text-meta text-slate-300">{t("community_me_followers")}</span>
              </Link>
              <Link href="/community/friends?tab=friends" className={`text-center min-w-[60px] min-h-[44px] flex flex-col justify-center rounded-[var(--radius-md)] ${communityCardLinkFocus}`} aria-label={`${friendsCount} ${t("community_me_friends")}`}>
                <span className="block text-h4 font-bold text-warning/90">{friendsCount}</span>
                <span className="text-meta text-slate-300">{t("community_me_friends")}</span>
              </Link>
              <div className="text-center min-w-[60px] min-h-[44px] flex flex-col justify-center" title={t("community_me_likes_received")} aria-label={`${likesReceived} ${t("community_me_likes_received")}`}>
                <span className="block text-h4 font-bold text-success">{likesReceived}</span>
                <span className="text-meta text-slate-300">{t("community_me_likes_received")}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <Link
            href="/community/me"
            className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
            aria-label={t("community_me_edit_profile")}
          >
            {t("community_me_edit_profile")}
          </Link>
          <Link
            href="/me"
            className={`rounded-full border border-slate-500/60 bg-slate-800/60 px-3 py-2.5 text-meta text-slate-300 hover:bg-slate-700/60 motion-sub min-h-[44px] min-w-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
            aria-label={t("community_me_settings")}
            title={t("community_me_settings")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </Link>
        </div>
      </header>

      {meUser ? (
        <MeTrustSection
          t={t}
          trust={parseMeTrustFromMeResponse(meQ.data, meUser)}
          showGuideRegisterLink={!userIsGuide(meUser)}
        />
      ) : null}

      {/* 你可能感兴趣的人：横向滚动 */}
      {suggestedUsers.length > 0 && (
        <section className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-4 mb-4" aria-labelledby={meSuggestedHeadingId}>
          <div className="flex items-center justify-between mb-3">
            <h2 id={meSuggestedHeadingId} className="text-body font-semibold text-slate-200">{t("community_me_suggested_people")}</h2>
          </div>
          <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1 scrollbar-hide">
            <div className="flex gap-3 pb-1 min-w-max">
              {suggestedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex-shrink-0 w-[120px] rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 p-3 text-center"
                >
                  <Link href={`/community/user/${user.id}`} className={`block rounded-[var(--radius-md)] ${communityCardLinkFocus}`}>
                    <div className="relative h-12 w-12 rounded-full overflow-hidden mx-auto mb-2 ring-2 ring-cyan-400/30">
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt="" fill className="object-cover" sizes="48px" unoptimized />
                      ) : (
                        <div className="h-full w-full bg-slate-600" />
                      )}
                    </div>
                    <p className="text-small font-medium text-slate-200 truncate">{user.nickname}</p>
                    <p className="text-meta text-slate-400 truncate mt-0.5 max-w-full">
                      {user.wallet ??
                        (user.bio?.slice(0, 12) ??
                          t(communityStoredRoleLabelI18nKey(user.role)))}
                    </p>
                    {user.isEscrowGuide ? (
                      <p className="text-[0.6rem] text-warning/85 truncate leading-tight mt-0.5">
                        {t("community_badge_escrow_guide")}
                      </p>
                    ) : null}
                  </Link>
                  <form
                    className="mt-2 block w-full"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      void handleSuggestedFollow(user.id);
                    }}
                  >
                    <button
                      type="submit"
                      disabled={suggestBusyId === user.id || suggestFollowedOptimistic.has(user.id)}
                      className={`w-full rounded-full border px-3 py-1.5 text-meta motion-sub min-h-[44px] inline-flex items-center justify-center disabled:opacity-70 disabled:cursor-wait ${
                        suggestFollowedOptimistic.has(user.id)
                          ? `border-slate-500 bg-slate-700/60 text-slate-300 ${communitySlatePillFocus}`
                          : `border-cyan-400/50 bg-cyan-500/20 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 ${communityCyanPillFocus}`
                      }`}
                      aria-pressed={suggestFollowedOptimistic.has(user.id)}
                      aria-busy={suggestBusyId === user.id ? true : undefined}
                    >
                      {suggestBusyId === user.id
                        ? t("common_loading")
                        : suggestFollowedOptimistic.has(user.id)
                          ? t("community_following")
                          : t("community_follow")}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 快捷入口：创作灵感、浏览记录、我的帖子、收藏、社区规范 */}
      <section className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-4 mb-4" aria-labelledby={meQuickHeadingId}>
        <h2 id={meQuickHeadingId} className="text-body font-semibold text-slate-200 mb-3">{t("community_me_quick_links")}</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/community"
            className={`rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-700/50 motion-sub min-h-[52px] ${communityCardLinkFocus}`}
          >
            <span className="flex-shrink-0 w-11 h-11 rounded-[var(--radius-md)] bg-warning/20 border border-warning/40 flex items-center justify-center text-warning/90" aria-hidden>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </span>
            <span>
              <span className="block text-small font-medium text-slate-200">{t("community_me_creative_inspiration")}</span>
              <span className="block text-meta text-slate-400">{t("community_me_creative_inspiration_desc")}</span>
            </span>
          </Link>
          <Link
            href="/community/me"
            className={`rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-700/50 motion-sub min-h-[52px] ${communityCardLinkFocus}`}
          >
            <span className="flex-shrink-0 w-11 h-11 rounded-[var(--radius-md)] bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300" aria-hidden>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <span>
              <span className="block text-small font-medium text-slate-200">{t("community_me_browse_history")}</span>
              <span className="block text-meta text-slate-400">{t("community_me_browse_history_desc")}</span>
            </span>
          </Link>
          <Link
            href="/community/me/posts"
            className={`rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-small font-medium text-cyan-300 hover:text-cyan-100 hover:bg-slate-700/50 motion-sub min-h-[44px] flex items-center justify-center ${communityCardLinkFocus}`}
          >
            {t("community_me_my_posts")}
          </Link>
          <Link
            href="/community/me/collects"
            className={`rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-small font-medium text-cyan-300 hover:text-cyan-100 hover:bg-slate-700/50 motion-sub min-h-[44px] flex items-center justify-center ${communityCardLinkFocus}`}
          >
            {t("community_me_my_collects")}
          </Link>
          <Link
            href="/community/me/reports"
            className={`rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-small font-medium text-white hover:bg-slate-700/50 motion-sub min-h-[44px] flex items-center justify-center ${communityCardLinkFocus}`}
          >
            {t("community_me_my_reports")}
          </Link>
          <Link
            href="/community/explore"
            className={`rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-small font-medium text-fuchsia-100 hover:bg-slate-700/50 motion-sub min-h-[44px] flex items-center justify-center col-span-2 ${communityCardLinkFocus}`}
          >
            {t("community_explore_title")}
          </Link>
          <Link
            href="/terms/community-guidelines"
            className={`rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-small font-medium text-slate-300 hover:bg-slate-700/50 motion-sub min-h-[44px] flex items-center justify-center col-span-2 ${communityCardLinkFocus}`}
          >
            {t("community_guidelines")}
          </Link>
        </div>
      </section>

      {/* 内容 Tab：笔记 | 收藏 | 赞过（参考个人中心） */}
      <section className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md overflow-hidden mb-4" aria-label={t("community_me_tab_notes")}>
        <div className="flex border-b border-slate-600/60" role="tablist" aria-label={t("community_me_quick_links")}>
          <Link
            href="/community/me/posts"
            className={`flex-1 py-3 text-center text-body font-semibold text-cyan-300 border-b-2 border-cyan-400 min-h-[44px] flex items-center justify-center ${communityMeTabBarLinkFocus}`}
            role="tab"
            aria-current="page"
          >
            {t("community_me_tab_notes")}
          </Link>
          <Link
            href="/community/me/collects"
            className={`flex-1 py-3 text-center text-meta text-slate-300 hover:text-slate-200 min-h-[44px] flex items-center justify-center motion-sub ${communityMeTabBarLinkFocus}`}
            role="tab"
          >
            {t("community_me_tab_collects")}
          </Link>
          <span
            className="flex-1 py-3 text-center text-meta text-slate-400 min-h-[44px] flex items-center justify-center gap-1"
            role="tab"
            aria-disabled="true"
            title={t("community_me_liked_empty")}
          >
            {t("community_me_tab_liked")}
          </span>
        </div>
        <div className="p-6 text-center">
          <p className="text-meta text-slate-400 mb-2">{t("community_me_tab_notes")}</p>
          <Link
            href="/community/me/posts"
            className={`inline-block rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] flex items-center justify-center ${communityCyanPillFocus}`}
          >
            {t("community_me_my_posts")}
          </Link>
        </div>
      </section>

      <p className="text-meta text-slate-400 text-center">{t("community_more_coming")}</p>

      {meToast ? (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-slate-900/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb"
          role="status"
          aria-live="polite"
        >
          {meToast}
        </div>
      ) : null}
    </main>
  );
}
