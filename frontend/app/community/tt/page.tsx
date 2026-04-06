"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";

/**
 * 50-G2：D.6 TT 社区子页面（31-TT社区页面设计、49 D.7）
 * 51-H1：硬编码迁 locales（community_tt_title / community_tt_subtitle / community_tt_cta）
 * 底叠层以 `community/layout.tsx`（88 §一）为准；本页仅前景玻璃卡 + CTA，不挂 Web3SciFiBackground / 市场氛围 / 第二套点阵。
 */
export default function TTCommunityPage() {
  const { t } = useTranslation();
  return (
    <main
      className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center px-4"
      aria-label={t("community_tt_title")}
    >
      <div className="mx-auto w-full max-w-lg motion-sub rounded-[var(--radius-xl)] bg-gradient-to-br from-ref-cyan/55 via-fuchsia-500/45 to-ref-coral/50 p-[1px] shadow-[0_0_48px_-12px_rgba(35,206,217,0.28)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-scifi-hover-strong">
        <div className="rounded-[var(--radius-xl)] border border-white/10 bg-slate-950/75 p-8 text-center shadow-scifi-panel backdrop-blur-xl">
          <h1 className="mb-2 bg-gradient-to-r from-ref-cyan via-fuchsia-400 to-ref-coral bg-clip-text text-h3 font-bold text-transparent sm:text-h2">
            {t("community_tt_title")}
          </h1>
          <p className="mb-6 text-small text-slate-300 sm:text-body">{t("community_tt_subtitle")}</p>
          <div className="flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/community"
              className={`inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-md)] bg-cta-gradient px-6 py-3 text-small font-semibold text-white shadow-medium transition-transform hover:brightness-110 active:scale-[0.98] motion-sub ${communityCyanPillFocus}`}
            >
              {t("community_tt_cta")}
            </Link>
            <Link
              href="/community/explore"
              className={`flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-fuchsia-400/45 bg-fuchsia-500/15 px-5 py-2.5 text-meta font-medium text-fuchsia-100 hover:bg-fuchsia-500/25 motion-sub ${communityFuchsiaPillFocus}`}
            >
              {t("community_explore_title")}
            </Link>
            <Link
              href="/terms/community-guidelines"
              prefetch={true}
              className={`flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/70 px-5 py-2.5 text-meta text-slate-300 hover:bg-slate-700/70 motion-sub ${communitySlatePillFocus}`}
            >
              {t("community_guidelines")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
