"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import MeQuickLinksSection from "@/components/me/MeQuickLinksSection";
import { FOCUS_RING } from "@/components/me/constants";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

type TFunc = (k: string) => string;

/** 与 `CommunityFeedDesktopAside` 目的地行一致 */
const ASIDE_DEST_ROW = `block w-full rounded-[var(--radius-md)] px-2.5 py-2 text-left text-meta motion-sub ${TT_COMMUNITY_FEED_ACTION.asideDestRowIdle} ${communityCardLinkFocus}`;

const ASIDE_FUCHSIA_ROW =
  `flex min-h-[44px] items-center justify-start rounded-[var(--radius-md)] px-2 py-2 text-meta text-ref-sun hover:text-ref-sun/95 hover:bg-ref-sun/10 motion-sub ${communityCardLinkFocus}`;

const ASIDE_SLATE_ROW =
  `flex min-h-[44px] items-center justify-start rounded-[var(--radius-md)] px-2 py-2 text-meta text-slate-400 hover:text-ref-sun/95 motion-sub ${communityCardLinkFocus}`;

/**
 * 社区个人中心：右侧 FAB 展开；面板视觉对齐动态页「热门目的地」侧栏（圆角卡 + 折叠 + 密列表）。
 */
export default function CommunityMeQuickLinksDrawer({
  t,
  showGuideHub,
  showMerchantHub,
  showStewardHub,
  showAcquisitionHub,
  likesListEnabled,
}: {
  t: TFunc;
  showGuideHub: boolean;
  showMerchantHub?: boolean;
  showStewardHub?: boolean;
  showAcquisitionHub?: boolean;
  likesListEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [listExpanded, setListExpanded] = useState(true);
  const panelId = useId();
  const titleId = useId();
  const listRegionId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        title={t("community_me_quick_drawer_toggle")}
        onClick={() => setOpen((v) => !v)}
        className={`${TT_COMMUNITY_DRAWER_L5.meQuickFab} ${FOCUS_RING}`}
      >
        <span className="sr-only">{t("community_me_quick_links")}</span>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[110] bg-black/55 motion-sub"
            aria-label={t("community_close")}
            onClick={close}
          />
          <div
            id={panelId}
            data-tt-community-me-quick-links-drawer="1"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed right-0 top-0 z-[115] flex h-[100dvh] w-[min(280px,calc(100vw-0.5rem))] flex-col p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          >
            <div className={TT_COMMUNITY_DRAWER_L5.meQuickPanel}>
              <header className={TT_COMMUNITY_DRAWER_L5.meQuickPanelHeader}>
                <h2 id={titleId} className="text-meta font-semibold text-ref-sun truncate pr-2 sm:text-body">
                  {t("community_me_quick_links")}
                </h2>
                <button
                  type="button"
                  onClick={close}
                  className={`${TT_COMMUNITY_DRAWER_L5.meQuickCloseBtn} ${FOCUS_RING}`}
                  aria-label={t("community_close")}
                >
                  ×
                </button>
              </header>

              <div className={`shrink-0 ${TT_COMMUNITY_FEED_ACTION.asideDivider}`}>
                <button
                  type="button"
                  onClick={() => setListExpanded((v) => !v)}
                  className={TT_COMMUNITY_DRAWER_L5.meQuickAccordionBtn}
                  aria-expanded={listExpanded}
                  aria-controls={listRegionId}
                  title={listExpanded ? t("community_feed_aside_collapse") : t("community_feed_aside_expand")}
                >
                  <svg
                    className={`h-4 w-4 shrink-0 text-ref-sun/90 transition-transform motion-reduce:transition-none ${listExpanded ? "rotate-0" : "-rotate-90"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>{t("me_quickLinks")}</span>
                </button>
              </div>

              {listExpanded ? (
                <div
                  id={listRegionId}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2 pt-1"
                  aria-label={t("community_me_quick_links")}
                >
                  <MeQuickLinksSection
                    t={t}
                    showGuideHub={showGuideHub}
                    showMerchantHub={showMerchantHub}
                    showStewardHub={showStewardHub}
                    showAcquisitionHub={showAcquisitionHub}
                    showLikesList={likesListEnabled}
                    compactForCommunityMe
                    embedded
                    hideHeading
                    presentation="asideList"
                    onLinkClick={close}
                  />

                  <section className={`mt-2 ${TT_COMMUNITY_FEED_ACTION.asideDivider} pt-2`} aria-label={t("community_me_quick_links_nav_aria")}>
                    <h3 className="px-2.5 mb-1.5 text-meta font-medium text-slate-300">{t("community_me_quick_links_nav_title")}</h3>
                    <ul className="space-y-0.5 list-none p-0 m-0">
                      {/* 订单/发布/收藏/赞过/举报：顶栏「我的」「工具」SSOT；勿在此重复（compact MeQuickLinksSection 同源） */}
                      <li>
                        <Link
                          href="/community"
                          onClick={close}
                          className={ASIDE_DEST_ROW}
                          title={t("community_me_creative_inspiration_desc")}
                        >
                          <span className="font-medium text-slate-100">{t("community_me_creative_inspiration")}</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/me/settings/profile" onClick={close} className={ASIDE_DEST_ROW} title={t("community_me_browse_history_desc")}>
                          <span className="font-medium text-slate-100">{t("community_me_browse_history")}</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/community/explore" onClick={close} className={ASIDE_FUCHSIA_ROW}>
                          {t("community_explore_title")}
                        </Link>
                      </li>
                      <li>
                        <Link href="/terms/community-guidelines" onClick={close} className={ASIDE_SLATE_ROW}>
                          {t("community_guidelines")}
                        </Link>
                      </li>
                      <li>
                        <Link href="/community/friends" onClick={close} className={ASIDE_FUCHSIA_ROW}>
                          {t("community_following_follow_more")}
                        </Link>
                      </li>
                    </ul>
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
