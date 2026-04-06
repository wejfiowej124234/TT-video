"use client";

import Image from "next/image";
import { useTranslation } from "@/components/LocaleProvider";
import type { GuideCardItem } from "@/lib/marketTypes";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

/** P29 向导卡片：向导照片 + 收藏 + 预约向导/查看向导；28 玻璃态 + DID/时薪 */
export type { GuideCardItem, GuidePriceRange } from "@/lib/marketTypes";

export default function GuideCard({
  guide,
  onView,
  onBookGuide,
  isFavorited,
  onToggleFavorite,
  glass,
}: {
  guide: GuideCardItem;
  onView: (id: string) => void;
  onBookGuide?: (id: string) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  glass?: boolean;
}) {
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const name = guide.city ? t("guide_card_cityGuide").replace("{{city}}", guide.city) : t("guide_card_guide");
  const langs = Array.isArray(guide.languages) ? guide.languages.slice(0, 3).join(" / ") : dash;
  const tags = Array.isArray(guide.service_types) ? guide.service_types : [];
  const avatarUrl = guide.avatar_url || null;
  const avatarAlt = t("guide_card_avatarAlt").replace("{{name}}", name);
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

  const articleClass = glass
    ? "group rounded-[var(--radius-md)] border border-white/20 bg-white/[0.06] backdrop-blur-md backdrop-saturate-150 shadow-[0_8px_32px_-10px_rgba(0,0,0,0.55),0_0_28px_-8px_rgba(35,206,217,0.1)] ring-1 ring-ref-cyan/15 overflow-hidden motion-sub transition-[transform,box-shadow,background-color] hover:-translate-y-1 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5),0_0_32px_-6px_rgba(35,206,217,0.2)] hover:bg-white/10 hover:ring-fuchsia-400/30"
    : "group rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/95 backdrop-blur-sm shadow-soft overflow-hidden motion-sub transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-strong";
  const contentClass = glass
    ? "p-4 space-y-3 bg-transparent backdrop-blur-sm border-t border-white/15"
    : "p-4 space-y-3 bg-bg-console/95 backdrop-blur-sm";
  const titleClass = glass ? "text-body font-semibold text-white" : "text-body font-semibold text-ink-900";
  const subClass = glass ? "text-meta text-white/80" : "text-meta text-ink-500";
  const metaClass = glass ? "text-small text-white/85" : "text-small text-ink-600";
  const tagClass = glass ? "rounded-[var(--radius-sm)] bg-white/15 text-white/90 px-2 py-0.5 text-meta" : "rounded-[var(--radius-sm)] bg-bg-soft text-ink-600 px-2 py-0.5 text-meta";
  const borderClass = glass ? "border-t border-white/15" : "border-t border-ink-100";
  const btnSecClass = glass
    ? "btn-console rounded-[var(--radius-sm)] border border-white/40 px-3 py-1.5 text-white text-small focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    : `btn-console rounded-[var(--radius-sm)] border border-ink-300 px-3 py-1.5 text-ink-700 text-small ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const favBtnClass = glass
    ? "inline-flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-soft hover:bg-white/25 transition-colors border border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    : `inline-flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full bg-bg-console shadow-soft hover:bg-bg-soft transition-colors border border-ink-200 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;

  return (
    <article className={articleClass} aria-labelledby={`guide-title-${guide.id}`}>
      <div className="relative aspect-[4/3] bg-bg-soft overflow-hidden">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={avatarAlt} fill className="object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 320px" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-bg-soft">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-h3 font-semibold ${glass ? "bg-travel-500/30 text-white" : "bg-travel-500/20 text-travel-500"}`}>{guide.city?.charAt(0) ?? t("market_guideAvatarFallback")}</div>
          </div>
        )}
        <div className="absolute top-2 right-2 z-10">
          {onToggleFavorite && (
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
          )}
        </div>
      </div>

      <div className={contentClass}>
        <div>
          <h3 id={`guide-title-${guide.id}`} className={titleClass}>{name}</h3>
          <p className={subClass}>{guide.city ?? dash}</p>
        </div>
        <p className={metaClass}><span className={glass ? "text-white/70" : "text-ink-500"}>{t("guide_card_lang")}</span>{langs}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="rounded-[var(--radius-sm)] bg-success/10 text-success px-2 py-0.5 text-meta font-medium" title={t("guide_card_didVerified")}>
            {t("guide_detail_didVerified")}
          </span>
          {guide.stake_amount != null && Number(guide.stake_amount) > 0 && <span className={subClass}>{t("guide_card_stake").replace("{{amount}}", String(guide.stake_amount))}</span>}
          {guide.rating != null && <span className={subClass}>{t("guide_card_rating").replace("{{n}}", String(guide.rating))}</span>}
          {guide.completedCount != null && <span className={subClass}>{t("guide_card_completed").replace("{{n}}", String(guide.completedCount))}</span>}
          {guide.responseSLA && <span className={subClass}>{t("guide_card_response").replace("{{n}}", guide.responseSLA)}</span>}
        </div>
        {(guide.priceRange?.guideFeePerDay != null || guide.priceRange?.carFeePerDay != null) && (
          <p className={metaClass}>
            {guide.priceRange.guideFeePerDay != null && <span>{t("guide_card_feePerDay").replace("{{amount}}", String(guide.priceRange.guideFeePerDay))}</span>}
            {guide.priceRange.carFeePerDay != null && <span className="ml-2">{t("guide_card_carPerDay").replace("{{amount}}", String(guide.priceRange.carFeePerDay))}</span>}
          </p>
        )}
        {hourlyLabel && (
          <div>
            <p className="text-body font-semibold text-travel-500">{hourlyLabel}</p>
            <p className={subClass}>{t("guide_card_onChainNote")}</p>
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 5).map((t) => (
              <span key={t} className={tagClass}>{t}</span>
            ))}
          </div>
        )}
        <div className={`flex flex-wrap gap-2 pt-1 ${borderClass}`}>
          {onBookGuide && (
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                onBookGuide(guide.id);
              }}
            >
              <button
                type="submit"
                className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] bg-travel-500 px-3 py-1.5 text-white text-small font-medium ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                aria-label={`${t("guide_card_book")} — ${name}`}
              >
                {t("guide_card_book")}
              </button>
            </form>
          )}
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
        </div>
      </div>
    </article>
  );
}
