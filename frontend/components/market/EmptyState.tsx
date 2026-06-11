"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { buildMarketCreateItineraryHref } from "@/lib/marketDeepLink";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_BTN_MARKET_PRIMARY,
  TT_MARKETING_MARKET_DARK_PATH,
  TT_MARKETING_MARKET_L5_EMPTY_FRAME,
  TT_MARKETING_MARKET_L5_EMPTY_ICON,
  TT_MARKETING_MARKET_L5_EMPTY_INNER,
  TT_MARKETING_MARKET_L5_EMPTY_STEP,
  TT_MARKETING_MARKET_L5_EMPTY_STEPS,
} from "@/lib/marketingUi";

function EmptyCrossNav({ darkBg }: { darkBg?: boolean }) {
  const p = TT_MARKETING_MARKET_DARK_PATH;
  return (
    <ProductCrossNav
      ariaLabelKey="empty_state_relatedNav_aria"
      showGuides
      className={`mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta ${darkBg ? "text-slate-300" : "text-ink-500"}`}
      linkClassName={darkBg ? p.emptyCrossNavLink : p.emptyStateLightCrossNavLink}
      separatorClassName={darkBg ? p.emptyCrossNavSep : "text-ink-300"}
    />
  );
}

function EmptyL5Shell({
  icon,
  title,
  subtitle,
  steps,
  children,
  darkBg,
  compactColumn,
}: {
  icon: string;
  title: string;
  subtitle: string;
  steps?: string[];
  children: ReactNode;
  darkBg?: boolean;
  compactColumn?: boolean;
}) {
  const p = TT_MARKETING_MARKET_DARK_PATH;
  const wrapClass = darkBg
    ? `${TT_MARKETING_MARKET_L5_EMPTY_FRAME} overflow-hidden`
    : "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft p-8 text-center";
  const innerClass = darkBg ? TT_MARKETING_MARKET_L5_EMPTY_INNER : "";
  const textClass = darkBg ? "text-body font-semibold text-slate-100" : "text-body text-ink-600";
  const subClass = darkBg ? "text-small text-slate-300/95 mt-2 leading-relaxed" : "text-small text-ink-500 mt-1";

  if (darkBg) {
    return (
      <div className={wrapClass} data-testid="market-empty-l5">
        <div className={innerClass}>
          <div className={TT_MARKETING_MARKET_L5_EMPTY_ICON} aria-hidden>
            {icon}
          </div>
          <p className={textClass}>{title}</p>
          <p className={subClass}>{subtitle}</p>
          {steps && steps.length > 0 ? (
            <ol className={TT_MARKETING_MARKET_L5_EMPTY_STEPS}>
              {steps.map((step, i) => (
                <li key={step} className={TT_MARKETING_MARKET_L5_EMPTY_STEP}>
                  <span className="font-semibold text-ref-sun/90">{i + 1}.</span> {step}
                </li>
              ))}
            </ol>
          ) : null}
          {children}
          {compactColumn ? null : <EmptyCrossNav darkBg={darkBg} />}
        </div>
      </div>
    );
  }

  return (
    <div className={wrapClass}>
      <p className={textClass}>{title}</p>
      <p className={subClass}>{subtitle}</p>
      {children}
      <EmptyCrossNav darkBg={darkBg} />
    </div>
  );
}

/** P29 空状态：无订单 / 无向导 / 无匹配；darkBg 时用于深色背景上白字；文案 i18n */
export type EmptyKind = "no-orders" | "no-guides" | "no-matches" | "bind-order-missing" | "no-guides-pick-for-order";

export default function EmptyState({
  kind,
  onResetFilters,
  darkBg,
  compactColumn,
  bindEscrowOrderId,
  onCustomItineraryClick,
  multipleOwnOrders = false,
}: {
  kind: EmptyKind;
  onResetFilters?: () => void;
  darkBg?: boolean;
  compactColumn?: boolean;
  bindEscrowOrderId?: string;
  onCustomItineraryClick?: () => void;
  multipleOwnOrders?: boolean;
}) {
  const { t } = useTranslation();
  const p = TT_MARKETING_MARKET_DARK_PATH;
  const btnOutClass = darkBg
    ? `${touchTargetLink44Classes} ${p.cardSecondaryBtn} mt-4`
    : `${touchTargetLink44Classes} btn-console mt-4 rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-ink-700 text-small ${travelFocusRingOffset2Classes}`;
  const linkSecondaryClass = darkBg
    ? `${touchTargetLink44Classes} ${p.cardSecondaryBtn}`
    : `${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-ink-600 text-small hover:bg-bg-soft ${travelFocusRingOffset2Classes}`;
  const primaryCtaClass = `${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY}`;

  if (kind === "no-orders") {
    return (
      <EmptyL5Shell
        darkBg={darkBg}
        compactColumn={compactColumn}
        icon="🧭"
        title={t("empty_noOrders")}
        subtitle={t("empty_noOrdersSub")}
        steps={[t("market_empty_orders_step1"), t("market_empty_orders_step2"), t("market_empty_orders_step3")]}
      >
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center items-center">
          {onCustomItineraryClick ? (
            <button type="button" onClick={onCustomItineraryClick} className={primaryCtaClass}>
              {t("market_customItinerary")}
            </button>
          ) : (
            <Link href="/" className={primaryCtaClass}>
              {t("empty_goCreateItinerary")}
            </Link>
          )}
          <Link href={buildMarketCreateItineraryHref()} className={linkSecondaryClass}>
            {t("empty_createDraft")}
          </Link>
        </div>
        <p className="mt-4 text-meta text-[#c9c2bc]/95 leading-relaxed">{t("market_empty_catalog_note")}</p>
      </EmptyL5Shell>
    );
  }

  if (kind === "no-guides-pick-for-order") {
    return (
      <EmptyL5Shell
        darkBg={darkBg}
        compactColumn={compactColumn}
        icon="🧑‍🏫"
        title={t("market_empty_guides_for_own_order_title")}
        subtitle={
          multipleOwnOrders
            ? t("market_empty_guides_for_own_order_sub_multi")
            : t("market_empty_guides_for_own_order_sub")
        }
        steps={[
          t("market_empty_guides_for_own_order_step1"),
          t("market_empty_guides_for_own_order_step2"),
          t("market_empty_guides_for_own_order_step3"),
        ]}
      >
        {onResetFilters ? (
          <form
            className="inline mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              onResetFilters();
            }}
          >
            <button type="submit" className={primaryCtaClass}>
              {t("empty_clearFilters")}
            </button>
          </form>
        ) : null}
        <Link href="/guide/register" className={`mt-3 inline-flex ${linkSecondaryClass}`}>
          {t("empty_applyGuide")}
        </Link>
        <p className="mt-4 text-meta text-[#c9c2bc]/95 leading-relaxed">{t("market_empty_catalog_note")}</p>
      </EmptyL5Shell>
    );
  }

  if (kind === "no-guides") {
    return (
      <EmptyL5Shell
        darkBg={darkBg}
        compactColumn={compactColumn}
        icon="🧑‍🏫"
        title={t("empty_noGuides")}
        subtitle={t("empty_noGuidesSub")}
        steps={[t("market_empty_guides_step1"), t("market_empty_guides_step2"), t("market_empty_guides_step3")]}
      >
        <Link href="/guide/register" className={`mt-5 inline-flex ${primaryCtaClass}`}>
          {t("empty_applyGuide")}
        </Link>
        <p className="mt-4 text-meta text-[#c9c2bc]/95 leading-relaxed">{t("market_empty_catalog_note")}</p>
      </EmptyL5Shell>
    );
  }

  if (kind === "bind-order-missing") {
    const escrowHref = bindEscrowOrderId?.trim()
      ? `/escrow/${encodeURIComponent(bindEscrowOrderId.trim())}`
      : "/market?view=split";
    return (
      <EmptyL5Shell darkBg={darkBg} compactColumn={compactColumn} icon="🔗" title={t("market_bind_empty_title")} subtitle={t("market_bind_empty_sub")}>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center items-center">
          <Link href={escrowHref} className={primaryCtaClass}>
            {t("market_bind_empty_back_escrow")}
          </Link>
          {onResetFilters ? (
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                onResetFilters();
              }}
            >
              <button type="submit" className={linkSecondaryClass} aria-label={t("empty_clearFiltersAria")}>
                {t("empty_clearFilters")}
              </button>
            </form>
          ) : null}
        </div>
      </EmptyL5Shell>
    );
  }

  return (
    <EmptyL5Shell darkBg={darkBg} compactColumn={compactColumn} icon="🔍" title={t("empty_noMatches")} subtitle={t("empty_noMatchesSub")}>
      {onResetFilters ? (
        <form
          className="inline mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            onResetFilters();
          }}
        >
          <button type="submit" className={btnOutClass} aria-label={t("empty_clearFiltersAria")}>
            {t("empty_clearFilters")}
          </button>
        </form>
      ) : null}
    </EmptyL5Shell>
  );
}
