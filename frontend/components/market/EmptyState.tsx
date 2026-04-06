"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 5.2 / 53：空态全站主链入口（与 ProductCrossNav、市场页脚一致） */
function EmptyCrossNav({ darkBg }: { darkBg?: boolean }) {
  return (
    <ProductCrossNav
      ariaLabelKey="empty_state_relatedNav_aria"
      showGuides
      className={`mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta ${darkBg ? "text-white/75" : "text-ink-500"}`}
      linkClassName={
        darkBg
          ? "inline-flex min-h-[44px] items-center justify-center text-white/90 hover:text-white hover:underline underline-offset-2 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          : `inline-flex min-h-[44px] items-center justify-center text-travel-600 hover:underline underline-offset-2 ${travelFocusRingOffset2Classes}`
      }
      separatorClassName={darkBg ? "text-white/35" : "text-ink-300"}
    />
  );
}

/** P29 空状态：无订单 / 无向导 / 无匹配；darkBg 时用于深色背景上白字；文案 i18n */
export type EmptyKind = "no-orders" | "no-guides" | "no-matches";

export default function EmptyState({
  kind,
  onResetFilters,
  darkBg,
}: {
  kind: EmptyKind;
  onResetFilters?: () => void;
  /** 深色背景上展示时使用白字与浅边框 */
  darkBg?: boolean;
}) {
  const { t } = useTranslation();
  const wrapClass = darkBg
    ? "rounded-[var(--radius-sm)] border border-white/25 bg-transparent p-8 text-center"
    : "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft p-8 text-center";
  const textClass = darkBg ? "text-body text-white" : "text-body text-ink-600";
  const subClass = darkBg ? "text-small text-white/85 mt-1" : "text-small text-ink-500 mt-1";
  const btnOutClass = darkBg
    ? `${touchTargetLink44Classes} btn-console mt-4 rounded-[var(--radius-sm)] border border-white/40 px-4 py-2 text-white text-small focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`
    : `${touchTargetLink44Classes} btn-console mt-4 rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-ink-700 text-small ${travelFocusRingOffset2Classes}`;
  const linkSecondaryClass = darkBg
    ? `${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-white/40 px-4 py-2 text-white/90 text-small hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`
    : `${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-ink-600 text-small hover:bg-bg-soft ${travelFocusRingOffset2Classes}`;
  const primaryCtaClass = darkBg
    ? `${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] bg-cta-gradient px-4 py-2 text-white text-small font-medium hover:brightness-110 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`
    : `${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] bg-cta-gradient px-4 py-2 text-white text-small font-medium hover:brightness-110 motion-sub ${travelFocusRingOffset2Classes}`;

  if (kind === "no-orders") {
    return (
      <div className={wrapClass}>
        <p className={textClass}>{t("empty_noOrders")}</p>
        <p className={subClass}>{t("empty_noOrdersSub")}</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center items-center">
          <Link href="/" className={primaryCtaClass}>
            {t("empty_goCreateItinerary")}
          </Link>
          <Link href="/itinerary/new" className={linkSecondaryClass}>
            {t("empty_createDraft")}
          </Link>
        </div>
        <EmptyCrossNav darkBg={darkBg} />
      </div>
    );
  }
  if (kind === "no-guides") {
    return (
      <div className={wrapClass}>
        <p className={textClass}>{t("empty_noGuides")}</p>
        <p className={subClass}>{t("empty_noGuidesSub")}</p>
        <Link href="/guide/register" className={`mt-4 ${primaryCtaClass}`}>
          {t("empty_applyGuide")}
        </Link>
        <EmptyCrossNav darkBg={darkBg} />
      </div>
    );
  }
  return (
    <div className={wrapClass}>
      <p className={textClass}>{t("empty_noMatches")}</p>
      <p className={subClass}>{t("empty_noMatchesSub")}</p>
      {onResetFilters && (
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            onResetFilters();
          }}
        >
          <button type="submit" className={btnOutClass} aria-label={t("empty_clearFiltersAria")}>
            {t("empty_clearFilters")}
          </button>
        </form>
      )}
      <EmptyCrossNav darkBg={darkBg} />
    </div>
  );
}
