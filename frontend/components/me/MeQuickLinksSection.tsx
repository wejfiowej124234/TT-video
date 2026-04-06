"use client";

import Link from "next/link";
import { useId } from "react";
import { FOCUS_RING } from "./constants";

export interface MeQuickLinksSectionProps {
  t: (k: string) => string;
  /** 向导账号显示「向导工作台」链至 `/guide`（07 §五 5.0 / 05） */
  showGuideHub?: boolean;
}

export default function MeQuickLinksSection({ t, showGuideHub }: MeQuickLinksSectionProps) {
  const titleId = useId();
  return (
    <section
      className="rounded-[var(--radius-md)] border border-slate-600/60 bg-slate-900/50 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-4 mb-4 sm:mb-6"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="text-meta text-slate-300 mb-2">{t("me_quickLinks")}</h2>
      <div className="flex flex-wrap gap-2">
        {showGuideHub ? (
          <Link
            href="/guide"
            className={`rounded-full border border-success/50 bg-success/15 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-success/95 hover:bg-success/25 motion-sub ${FOCUS_RING}`}
          >
            {t("guide_dashboard_title")}
          </Link>
        ) : null}
        <Link
          href="/orders"
          className={`rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 motion-sub ${FOCUS_RING}`}
        >
          {t("nav_orders")}
        </Link>
        <Link
          href="/pay"
          className={`rounded-full border border-success/45 bg-success/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-success/95 hover:bg-success/20 motion-sub ${FOCUS_RING}`}
        >
          {t("header_payHub")}
        </Link>
        <Link
          href="/market"
          className={`rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 motion-sub ${FOCUS_RING}`}
        >
          {t("header_market")}
        </Link>
        <Link
          href="/guides"
          className={`rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 motion-sub ${FOCUS_RING}`}
        >
          {t("nav_guides")}
        </Link>
        <Link
          href="/community"
          className={`rounded-full border border-fuchsia-400/50 bg-fuchsia-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/20 motion-sub ${FOCUS_RING}`}
        >
          {t("header_community")}
        </Link>
        <Link
          href="/community/me/posts"
          className={`rounded-full border border-fuchsia-400/50 bg-fuchsia-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/20 motion-sub ${FOCUS_RING}`}
        >
          {t("community_me_my_posts")}
        </Link>
        <Link
          href="/community/me/collects"
          className={`rounded-full border border-fuchsia-400/50 bg-fuchsia-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/20 motion-sub ${FOCUS_RING}`}
        >
          {t("community_me_my_collects")}
        </Link>
        <Link
          href="/community/me/reports"
          className={`rounded-full border border-warning/40 bg-warning/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-warning/95 hover:bg-warning/20 motion-sub ${FOCUS_RING}`}
        >
          {t("community_me_my_reports")}
        </Link>
        <Link
          href="/did-rank"
          className={`rounded-full border border-warning/40 bg-warning/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-warning/90 hover:bg-warning/20 motion-sub ${FOCUS_RING}`}
        >
          {t("didRank_title")}
        </Link>
        <Link
          href="/community/feedback"
          className={`rounded-full border border-success/45 bg-success/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-success/95 hover:bg-success/20 motion-sub ${FOCUS_RING}`}
        >
          {t("me_link_feedback")}
        </Link>
      </div>
      <p className="text-meta text-slate-400 mt-2">
        {t("me_communityHint")}
      </p>
    </section>
  );
}
