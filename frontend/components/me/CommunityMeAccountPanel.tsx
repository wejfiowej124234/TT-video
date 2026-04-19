"use client";

import { useEffect, useRef, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import MeStatsSection from "@/components/me/MeStatsSection";
import MeProfileSection from "@/components/me/MeProfileSection";
import CommunityMeQuickLinksDrawer from "@/components/community/CommunityMeQuickLinksDrawer";
import { useMePage } from "@/components/me/useMePage";
import { FOCUS_RING, type UserShape } from "@/components/me/constants";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communitySlatePillFocus,
  communityWarningPillFocus,
} from "@/lib/communityA11yFocus";
import { communityRoleLabelI18nKey, meProtocolRoleForDisplay } from "@/lib/meRoleDisplay";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import {
  communityMeCollectsPathActive,
  communityMeContentSegmentClass,
  communityMePostsPathActive,
} from "@/lib/communityMeContentNav";

type TFunc = (k: string) => string;

export type CommunityMeHeaderStats = {
  statsLoading: boolean;
  followingCount: number;
  followersCount: number;
  friendsCount: number;
  likesReceived: number;
};

function mePageStatNumber(stats: unknown, key: string): number | null {
  if (!stats || typeof stats !== "object") return 0;
  const o = stats as Record<string, unknown>;
  if (!(key in o)) return 0;
  const v = o[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

/**
 * 登录后在 TT 社区「个人中心」内嵌原 `/me`：顶栏资料卡内含笔记/收藏/赞过入口、统计与可折叠账户详情；全站快捷抽屉；改密/退出由页面置于「身份与验证」下方。
 * 仅在 `enabled` 为 true 时挂载，避免未登录时触发 `useMePage` 的登录重定向。
 */
export default function CommunityMeAccountPanel({
  t,
  enabled,
  communityStats,
  compactVertical = false,
}: {
  t: TFunc;
  enabled: boolean;
  communityStats?: CommunityMeHeaderStats;
  /** 社区「我的」：压缩资料卡与统计区高度 */
  compactVertical?: boolean;
}) {
  if (!enabled) return null;
  return <CommunityMeAccountPanelInner t={t} communityStats={communityStats} compactVertical={compactVertical} />;
}

function CommunityMeAccountPanelInner({
  t,
  communityStats,
  compactVertical,
}: {
  t: TFunc;
  communityStats?: CommunityMeHeaderStats;
  compactVertical: boolean;
}) {
  const hook = useMePage(t);
  const pathname = usePathname();
  const profileDetailsRef = useRef<HTMLDetailsElement>(null);
  const profileReady =
    !hook.loading && !hook.error && Boolean((hook.data as { user?: UserShape })?.user);

  useEffect(() => {
    if (!compactVertical || !profileReady) return;
    const openIfHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#me-platform-profile" && profileDetailsRef.current) {
        profileDetailsRef.current.open = true;
      }
    };
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
    return () => window.removeEventListener("hashchange", openIfHash);
  }, [compactVertical, profileReady]);

  if (hook.loading) {
    return (
      <div className="rounded-[var(--radius-md)] border border-cyan-500/25 bg-slate-900/50 px-4 py-6 animate-pulse" aria-busy="true">
        <div className="h-5 w-32 bg-slate-600/50 rounded-[var(--radius-sm)] mb-4" />
        <div className="h-24 bg-slate-700/40 rounded-[var(--radius-md)]" />
      </div>
    );
  }

  if (hook.error) {
    return (
      <div className="rounded-[var(--radius-md)] border border-slate-600/60 bg-slate-900/60 px-4 py-4 space-y-3">
        <ApiErrorAlert message={hook.error} />
        <form
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            hook.loadMe();
          }}
        >
          <button
            type="submit"
            className={`inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 min-h-[44px] text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${FOCUS_RING}`}
          >
            {t("common_retry")}
          </button>
        </form>
      </div>
    );
  }

  const user = (hook.data as { user?: UserShape })?.user;
  if (!user) return null;

  const ordersTotal = mePageStatNumber(hook.stats, "orders_total");
  const reviewsCount = mePageStatNumber(hook.stats, "reviews_count");
  const totalSpent = mePageStatNumber(hook.stats, "total_spent");

  const displayName = (user.nickname?.trim() && user.nickname.trim()) || user.id?.slice(0, 8) || t("me_defaultDisplayName");
  const headerInitial = (displayName.trim().charAt(0) || "?").toUpperCase();
  const headerAvatarUrl = user.avatar_url?.trim() ?? "";
  const rawWallet = user.default_wallet_address?.trim();
  const walletPreview =
    rawWallet && rawWallet.length > 0
      ? formatWalletOrDidShort(rawWallet) ?? rawWallet
      : t("community_did_placeholder");

  const cs = communityStats;
  const statsLoading = cs?.statsLoading ?? false;
  const followingCount = cs?.followingCount ?? 0;
  const followersCount = cs?.followersCount ?? 0;
  const friendsCount = cs?.friendsCount ?? 0;
  const likesReceived = cs?.likesReceived ?? 0;

  const postsPathActive = communityMePostsPathActive(pathname);
  const collectsPathActive = communityMeCollectsPathActive(pathname);

  return (
    <div className={compactVertical ? "space-y-3" : "space-y-4 sm:space-y-5"}>
      <section
        className={`rounded-[var(--radius-md)] border border-cyan-400/35 bg-slate-900/60 backdrop-blur-md shadow-scifi-banner ring-1 ring-white/5 ${
          compactVertical ? "px-3 py-3 sm:px-4" : "px-4 py-6"
        }`}
        aria-label={t("community_me_profile_card_aria")}
      >
        <div className={`flex items-start ${compactVertical ? "gap-3" : "gap-4"}`}>
          <div className="relative flex-shrink-0">
            <div
              className={`relative rounded-full overflow-hidden ring-2 ring-cyan-400/50 bg-slate-800 flex items-center justify-center ${
                compactVertical ? "h-16 w-16" : "h-20 w-20"
              }`}
            >
              {headerAvatarUrl ? (
                <Image
                  src={headerAvatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes={compactVertical ? "64px" : "80px"}
                  unoptimized
                />
              ) : (
                <span className="relative z-[1] text-h3 font-semibold text-cyan-200" aria-hidden>
                  {headerInitial}
                </span>
              )}
            </div>
            <form className="absolute -bottom-0.5 -right-0.5" onSubmit={(e: FormEvent) => e.preventDefault()}>
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
            <h1 className={`font-bold text-slate-100 ${compactVertical ? "text-body-l sm:text-h4" : "text-h4"}`}>{displayName}</h1>
            <p className="text-meta text-cyan-300 mt-0.5">
              {t(communityRoleLabelI18nKey(meProtocolRoleForDisplay(user)))}
            </p>
            <p className="text-meta text-slate-300 mt-0.5 break-all">
              {t("community_did_wallet_label")}
              {t("community_did_colon")}
              <span className="text-slate-100/95 font-mono text-[0.8125rem]">{walletPreview}</span>
            </p>
            <div className={compactVertical ? "mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5" : "mt-2"}>
              {compactVertical ? (
                <span className="text-[0.65rem] text-slate-500 truncate max-w-[10rem] sm:max-w-[14rem]">{t("community_me_bio_empty")}</span>
              ) : (
                <p className="text-small text-slate-300">{t("community_me_bio_empty")}</p>
              )}
              <form className="inline" onSubmit={(e: FormEvent) => e.preventDefault()}>
                <button
                  type="submit"
                  className={`text-meta text-cyan-300 hover:text-cyan-100 ${compactVertical ? "" : "mt-1"} motion-sub underline underline-offset-2 min-h-[44px] inline-flex items-center justify-center ${communityCardLinkFocus}`}
                  aria-label={t("community_me_add_bio")}
                >
                  {t("community_me_add_bio")}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div
          className={`flex border-t border-slate-600/45 flex-wrap ${compactVertical ? "mt-3 pt-3 justify-between gap-2 max-w-md mx-auto w-full sm:max-w-none sm:justify-center sm:gap-6" : "gap-4 sm:gap-6 mt-4 pt-4"}`}
        >
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
              <Link
                href="/community/friends?tab=following"
                className={`text-center min-w-[60px] min-h-[44px] flex flex-col justify-center rounded-[var(--radius-md)] ${communityCardLinkFocus}`}
                aria-label={`${followingCount} ${t("community_me_following")}`}
              >
                <span className="block text-h4 font-bold text-cyan-300">{followingCount}</span>
                <span className="text-meta text-slate-300">{t("community_me_following")}</span>
              </Link>
              <Link
                href="/community/friends?tab=followers"
                className={`text-center min-w-[60px] min-h-[44px] flex flex-col justify-center rounded-[var(--radius-md)] ${communityCardLinkFocus}`}
                aria-label={`${followersCount} ${t("community_me_followers")}`}
              >
                <span className="block text-h4 font-bold text-fuchsia-300">{followersCount}</span>
                <span className="text-meta text-slate-300">{t("community_me_followers")}</span>
              </Link>
              <Link
                href="/community/friends?tab=friends"
                className={`text-center min-w-[60px] min-h-[44px] flex flex-col justify-center rounded-[var(--radius-md)] ${communityCardLinkFocus}`}
                aria-label={`${friendsCount} ${t("community_me_friends")}`}
              >
                <span className="block text-h4 font-bold text-warning/90">{friendsCount}</span>
                <span className="text-meta text-slate-300">{t("community_me_friends")}</span>
              </Link>
              <div
                className="text-center min-w-[60px] min-h-[44px] flex flex-col justify-center"
                title={t("community_me_likes_received")}
                aria-label={`${likesReceived} ${t("community_me_likes_received")}`}
              >
                <span className="block text-h4 font-bold text-success">{likesReceived}</span>
                <span className="text-meta text-slate-300">{t("community_me_likes_received")}</span>
              </div>
            </>
          )}
        </div>

        <div className={`flex items-center gap-2 flex-wrap ${compactVertical ? "mt-3" : "mt-4"}`}>
          <Link
            href="#me-platform-profile"
            onClick={() => {
              if (compactVertical && profileDetailsRef.current) {
                profileDetailsRef.current.open = true;
              }
            }}
            className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 text-meta font-medium text-cyan-200 hover:text-cyan-50 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
            aria-label={t("community_me_edit_profile")}
          >
            {t("community_me_edit_profile")}
          </Link>
          <Link
            href="#me-account-security"
            className={`rounded-full border border-slate-500/70 bg-slate-800/80 px-3 py-2.5 text-meta text-slate-200 hover:bg-slate-700/80 hover:text-white motion-sub min-h-[44px] min-w-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
            aria-label={t("community_me_settings")}
            title={t("community_me_settings")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>

        {compactVertical ? (
          <nav
            className="mt-3 rounded-[var(--radius-md)] border border-slate-600/40 bg-slate-950/45 p-0.5 overflow-hidden"
            aria-label={t("community_me_notes_tablist_aria")}
            title={t("community_me_notes_tab_hint")}
          >
            <ul className="grid grid-cols-3 list-none p-0 m-0 gap-0.5 text-center">
              <li className="min-w-0">
                <Link
                  href="/community/me/posts"
                  className={communityMeContentSegmentClass(postsPathActive)}
                  aria-current={postsPathActive ? "page" : undefined}
                >
                  {t("community_me_tab_notes")}
                </Link>
              </li>
              <li className="min-w-0">
                <Link
                  href="/community/me/collects"
                  className={communityMeContentSegmentClass(collectsPathActive)}
                  aria-current={collectsPathActive ? "page" : undefined}
                >
                  {t("community_me_tab_collects")}
                </Link>
              </li>
              <li className="min-w-0">
                <span
                  className="flex min-h-[44px] cursor-not-allowed items-center justify-center px-2 py-2 text-[0.7rem] sm:text-meta text-slate-500/90 line-clamp-2 leading-tight"
                  aria-disabled="true"
                  title={t("community_me_liked_empty")}
                >
                  {t("community_me_tab_liked")}
                </span>
              </li>
            </ul>
          </nav>
        ) : null}

        {compactVertical ? (
          <>
            <MeStatsSection
              t={t}
              statsLoading={hook.statsLoading}
              statsError={hook.statsError}
              loadStats={hook.loadStats}
              ordersTotal={ordersTotal}
              reviewsCount={reviewsCount}
              totalSpent={totalSpent}
              compact
              embedded
            />
            <details
              ref={profileDetailsRef}
              id="me-platform-profile"
              className="group border-t border-slate-600/40 pt-2 mt-2.5 rounded-[var(--radius-sm)]"
            >
              <summary
                className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--radius-md)] px-1 py-2 text-meta font-medium text-slate-200 hover:bg-slate-800/50 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 min-h-[44px] [&::-webkit-details-marker]:hidden"
                aria-label={t("community_me_account_details_summary")}
              >
                <span>{t("community_me_account_details_summary")}</span>
                <svg
                  className="h-4 w-4 shrink-0 text-cyan-400/90 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <MeProfileSection
                t={t}
                user={user}
                editing={hook.editing}
                setEditing={hook.setEditing}
                editForm={hook.editForm}
                setEditForm={hook.setEditForm}
                submitError={hook.submitError}
                submitting={hook.submitting}
                avatarError={hook.avatarError}
                setAvatarError={hook.setAvatarError}
                copiedField={hook.copiedField}
                copyClipboardBusy={hook.copyClipboardBusy}
                copyToClipboard={hook.copyToClipboard}
                connectedAddress={hook.connectedAddress}
                syncingWallet={hook.syncingWallet}
                editButtonRef={hook.editButtonRef}
                handleSubmit={hook.handleSubmit}
                handleSyncWallet={hook.handleSyncWallet}
                compactCommunityLayout
                unifiedInCommunityCard
                omitAnchorId
                insetInCollapsible
              />
            </details>
          </>
        ) : (
          <MeProfileSection
            t={t}
            user={user}
            editing={hook.editing}
            setEditing={hook.setEditing}
            editForm={hook.editForm}
            setEditForm={hook.setEditForm}
            submitError={hook.submitError}
            submitting={hook.submitting}
            avatarError={hook.avatarError}
            setAvatarError={hook.setAvatarError}
            copiedField={hook.copiedField}
            copyClipboardBusy={hook.copyClipboardBusy}
            copyToClipboard={hook.copyToClipboard}
            connectedAddress={hook.connectedAddress}
            syncingWallet={hook.syncingWallet}
            editButtonRef={hook.editButtonRef}
            handleSubmit={hook.handleSubmit}
            handleSyncWallet={hook.handleSyncWallet}
            compactCommunityLayout
            unifiedInCommunityCard
          />
        )}
      </section>

      {compactVertical ? null : (
        <MeStatsSection
          t={t}
          statsLoading={hook.statsLoading}
          statsError={hook.statsError}
          loadStats={hook.loadStats}
          ordersTotal={ordersTotal}
          reviewsCount={reviewsCount}
          totalSpent={totalSpent}
          compact={false}
        />
      )}
      <CommunityMeQuickLinksDrawer t={t} showGuideHub={user.role === "guide"} />
    </div>
  );
}
