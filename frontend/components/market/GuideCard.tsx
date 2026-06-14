"use client";

import { memo, type KeyboardEvent, type MouseEvent } from "react";
import { MarketGuideCover } from "@/components/market/MarketGuideCover";
import { useTranslation } from "@/components/LocaleProvider";
import type { GuideCardItem } from "@/lib/marketTypes";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";
import {
  filterGuidePublicServiceTypes,
  formatGuideLanguages,
  formatGuidePublicBio,
  formatGuideServiceTypeLabel,
} from "@/lib/marketDisplayCopy";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import { GuideIdentityStakeTrustBadge } from "@/components/guide/GuideIdentityStakeTrustBadge";
import { TT_MARKETING_BTN_MARKET_PRIMARY, TT_MARKETING_MARKET_DARK_PATH, TT_MARKETING_MARKET_L5_LIST_CARD_FRAME, TT_MARKETING_MARKET_L5_LIST_CARD_INNER } from "@/lib/marketingUi";

/** P29 向导卡片：向导照片 + 收藏 + 预约向导/查看向导；28 玻璃态 + DID/时薪 */
export type { GuideCardItem, GuidePriceRange } from "@/lib/marketTypes";

function GuideCard({
  guide,
  onView,
  onBookGuide,
  bookGuideLabelKey = "guide_card_book",
  isFavorited,
  onToggleFavorite,
  glass,
  coverEager = false,
  previewOnly = false,
}: {
  guide: GuideCardItem;
  onView?: (id: string) => void;
  onBookGuide?: (id: string) => void;
  /** Escrow 绑定向导模式：主按钮文案 */
  bookGuideLabelKey?: string;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  glass?: boolean;
  coverEager?: boolean;
  /** 工作台/设置只读预览：无假按钮、不可点击 */
  previewOnly?: boolean;
}) {
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const name = formatGuideDisplayName(t, guide);
  const langs = formatGuideLanguages(guide.languages, t, " / ");
  const tags = filterGuidePublicServiceTypes(guide.service_types);
  const avatarAlt = t("guide_card_avatarAlt").replace("{{name}}", name);
  const cityLabel = guide.city ?? dash;
  const hourlyCurrencyLabel =
    typeof guide.hourly_currency === "string" && guide.hourly_currency.trim()
      ? guide.hourly_currency.trim()
      : t("market_guide_hourly_currency_unspecified");
  const hourlyLabel =
    guide.hourly_rate != null && guide.hourly_rate !== ""
      ? t("guide_card_perHour")
          .replace("{{amount}}", String(guide.hourly_rate))
          .replace("{{currency}}", hourlyCurrencyLabel)
      : null;
  const hourlyDisplayGlass = hourlyLabel ?? (glass ? t("market_guide_hourly_on_request") : null);
  const stakeDisplay = guide.stake_amount?.trim() ? guide.stake_amount.trim() : null;
  const openDetail = () => {
    if (previewOnly || !onView) return;
    onView(guide.id);
  };

  const p = TT_MARKETING_MARKET_DARK_PATH;
  const articleClass = glass
    ? `${TT_MARKETING_MARKET_L5_LIST_CARD_FRAME} ${previewOnly ? "" : p.cardInteractive} group`
    : "group rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/95 backdrop-blur-sm shadow-soft overflow-hidden motion-sub transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-strong";
  const contentClass = glass ? `${p.cardBodyPadding} ${p.cardContentDivider}` : "p-4 space-y-3 bg-bg-console/95 backdrop-blur-sm";
  const titleClass = glass ? "text-body font-semibold text-slate-100" : "text-body font-semibold text-ink-900";
  const subClass = glass ? "text-meta text-slate-300" : "text-meta text-ink-500";
  const metaClass = glass ? "text-small text-slate-200" : "text-small text-ink-600";
  const tagClass = glass ? p.cardTagChip : "rounded-[var(--radius-sm)] bg-bg-soft text-ink-600 px-2 py-0.5 text-meta";
  const borderClass = glass ? p.cardContentDivider : "border-t border-ink-100";
  const btnBookClass = glass
    ? `${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY}`
    : `${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] bg-travel-500 px-3 py-1.5 text-white text-small font-medium ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const btnSecClass = glass
    ? p.cardViewItineraryLink
    : `btn-console rounded-[var(--radius-sm)] border border-ink-300 px-3 py-1.5 text-ink-700 text-small ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const favBtnClass = glass
    ? p.cardFavBtn
    : `inline-flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full bg-bg-console shadow-soft hover:bg-bg-soft transition-colors border border-ink-200 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;

  const bioTeaser = formatGuidePublicBio(guide.bio);
  const stopCardBubble = (e: MouseEvent) => e.stopPropagation();

  const cardBody = (
    <>
      <div className="relative">
        <MarketGuideCover
          guide={guide}
          glass={glass}
          compact={glass}
          coverEager={coverEager}
          avatarAlt={avatarAlt}
          name={name}
          cityLabel={cityLabel}
          hourlyChip={glass ? null : hourlyLabel}
        />
        <div className="absolute top-2 right-2 z-10" onClick={stopCardBubble}>
          {onToggleFavorite ? (
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                onToggleFavorite(guide.id);
              }}
            >
              <button
                type="submit"
                className={favBtnClass}
                aria-label={isFavorited ? t("empty_unfavoriteAria") : t("empty_favoriteAria")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className={isFavorited ? "text-danger" : glass ? "text-white/80" : "text-ink-500"} aria-hidden>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className={contentClass} onClick={stopCardBubble}>
        <div>
          <h3 id={`guide-title-${guide.id}`} className={titleClass}>
            {name}
          </h3>
          <p className={subClass}>{cityLabel}</p>
          {glass && bioTeaser ? <p className={`${subClass} mt-1 line-clamp-2`}>{bioTeaser}</p> : null}
        </div>
        <p className={metaClass}>
          <span className={glass ? "text-slate-400" : "text-ink-500"}>{t("guide_card_lang")}</span>
          {langs}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={p.trustDidVerified} title={t("guide_card_didVerified")}>
            <span aria-hidden="true" className="text-ref-sun/85">
              ✓
            </span>
            {t("guide_detail_didVerified")}
          </span>
          {stakeDisplay ? <GuideIdentityStakeTrustBadge stakeAmount={stakeDisplay} size="sm" /> : null}
        </div>
        {glass && hourlyDisplayGlass ? (
          <p
            className={
              hourlyLabel
                ? "text-body font-semibold text-ref-sun tabular-nums [color:var(--ref-sun)]"
                : p.cardHourlyOnRequest
            }
          >
            {hourlyDisplayGlass}
          </p>
        ) : null}
        {!glass && hourlyLabel ? (
          <div>
            <p className={`text-body font-semibold ${glass ? "text-ref-sun" : "text-travel-500"}`}>{hourlyLabel}</p>
            <p className={subClass}>{t("guide_card_onChainNote")}</p>
          </div>
        ) : null}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, glass ? 3 : 5).map((tag) => (
              <span key={tag} className={tagClass}>
                {formatGuideServiceTypeLabel(tag, t)}
              </span>
            ))}
          </div>
        )}
        {!previewOnly ? (
        <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${glass ? `${p.cardActionRow} ${borderClass}` : `pt-1 ${borderClass}`}`}>
          {onBookGuide && (
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                onBookGuide(guide.id);
              }}
            >
              <button type="submit" className={btnBookClass} aria-label={`${t(bookGuideLabelKey)} — ${name}`}>
                {t(bookGuideLabelKey)}
              </button>
            </form>
          )}
          {onView ? (
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onView(guide.id);
            }}
          >
            <button type="submit" className={`${touchTargetLink44Classes} ${btnSecClass}`}>
              {t("guide_card_view")}
            </button>
          </form>
          ) : null}
        </div>
        ) : null}
      </div>
    </>
  );

  return (
    <article
      className={articleClass}
      aria-labelledby={`guide-title-${guide.id}`}
      {...(previewOnly
        ? { "data-tt-guide-card-preview": "1" }
        : {
            role: "button",
            tabIndex: 0,
            onClick: openDetail,
            onKeyDown: (e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDetail();
              }
            },
          })}
    >
      {glass ? <div className={TT_MARKETING_MARKET_L5_LIST_CARD_INNER}>{cardBody}</div> : cardBody}
    </article>
  );
}

export default memo(GuideCard);
