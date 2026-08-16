"use client";

import { memo } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import MarketRemoteListingImage from "@/components/market/MarketRemoteListingImage";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import { UgcTranslatedText } from "@/components/ugc/UgcTranslatedText";

export type MarketSubsiteMasonryItem = {
  /** 收购子站：标题旁独立角标（不挤进 h2 文案） */
  listingKind?: "acquisition";
  /** 无 `?` 前缀；若 `extraQuery` 有值则拼为 `href?extraQuery`（仅 Link 模式） */
  href: string;
  /** 与 URL `listing` 参数一致；`onListingOpen` 时必填 */
  listingId: string;
  /** 若设置：整卡走该链接（如刚同步的社区笔记），不打开子站演示抽屉 */
  directHref?: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  subtitle?: string;
  /** 底栏左侧小字（店名 / 发布者） */
  footer: string;
  /** 角标（城市 / 路线） */
  pill?: string;
  /** 右侧金额或悬赏摘要 */
  meta?: string;
};

type Props = {
  /** 供测试与无障碍 */
  listLabelKey: string;
  items: MarketSubsiteMasonryItem[];
  /** 透传列表筛选 query，返回列表时可恢复上下文（仅 Link 模式） */
  extraQuery?: string;
  /** 与旅行预约「查看详情」侧栏一致：整卡点击打开右侧抽屉（写入 `listing` query） */
  onListingOpen?: (listingId: string) => void;
  /** 列表角标 i18n key：`demo` vs **`postgres_catalog`** 目录 */
  badgeKey?: string;
  /** 工作台/设置预览：只展示卡片，不可点击跳转 */
  previewOnly?: boolean;
};

const D = TT_MARKETING_MARKET_DARK_PATH;
const cardFrame = D.masonryCard;

/** 勿叠 `touchTargetLink44Classes`（含 inline-flex）在整卡 button 上，否则会变成左图右文；须保持上图下文与原先 Link 一致。 */
const drawerCardButtonClass = `${cardFrame} group block w-full cursor-pointer text-left ${D.masonryCardFocus}`;

const linkRing = `group block ${D.masonryCardFocus} ${travelFocusRingOffset2Classes}`;

function masonryMediaAspectClass(itemIdx: number): string {
  if (itemIdx % 3 === 0) return "aspect-[4/5] sm:aspect-[3/4]";
  if (itemIdx % 3 === 1) return "aspect-[5/6] sm:aspect-[4/5]";
  return "aspect-[3/4] sm:aspect-[5/6]";
}

/** 双列瀑布流（CSS columns）；抽屉模式与旅行预约列表一致。 */
function MarketSubsiteMasonry({
  listLabelKey,
  items,
  extraQuery,
  onListingOpen,
  badgeKey = "market_subsite_masonry_demo_badge",
  previewOnly = false,
}: Props) {
  const { t } = useTranslation();
  const label = t(listLabelKey);

  return (
    <section className="mx-auto max-w-5xl px-4 py-5 sm:py-6" aria-label={label}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <span className={TT_MARKETING_MARKET_DARK_PATH.masonryListingPill}>
          {t(badgeKey)}
        </span>
        <p
          className="w-full text-meta leading-snug text-slate-300/90 sm:max-w-md sm:flex-1 sm:text-right"
          role="note"
        >
          {t("market_subsite_no_post_interactions_hint")}
        </p>
      </div>
      <ul className="columns-1 gap-4 sm:columns-2 [column-fill:_balance] [content-visibility:auto]">
        {items.map((item, itemIdx) => {
          const fullHref = extraQuery ? `${item.href}?${extraQuery}` : item.href;
          const externalHref = item.directHref?.trim();
          const cardInner = (
            <>
              <div
                className={`relative w-full overflow-hidden bg-ink-800/80 ${masonryMediaAspectClass(itemIdx)}`}
              >
                <MarketRemoteListingImage
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  fill
                  className="object-cover motion-safe:transition motion-safe:duration-300 motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority={itemIdx < 2}
                  fallbackSeed={item.listingId}
                />
                <div className={D.cardCoverScrim} aria-hidden />
                {item.pill ? (
                  <span className={`absolute bottom-2.5 left-2.5 z-[2] max-w-[calc(100%-1rem)] ${D.cardCoverChip}`}>
                    {item.pill}
                  </span>
                ) : null}
              </div>
              <div className="space-y-1.5 p-3.5">
                <div className="flex flex-wrap items-start gap-2">
                  {item.listingKind === "acquisition" ? (
                    <span className={`shrink-0 ${D.trustEscrowBadge}`}>{t("market_subsite_acquisition_badge")}</span>
                  ) : null}
                  <h2 className="min-w-0 flex-1 text-body font-semibold leading-snug text-white line-clamp-2">
                    <UgcTranslatedText
                      as="span"
                      policy="cache_first"
                      contentClass={item.listingKind === "acquisition" ? "acquisition_listing" : "merchant_listing"}
                      contentId={item.listingId}
                      field="title"
                      originalText={item.title}
                    />
                  </h2>
                </div>
                {item.subtitle ? (
                  <p
                    className={`text-meta leading-snug text-slate-200/90 ${
                      itemIdx % 2 === 0 ? "line-clamp-2" : "line-clamp-3"
                    }`}
                  >
                    <UgcTranslatedText
                      as="span"
                      policy="cache_first"
                      contentClass={item.listingKind === "acquisition" ? "acquisition_listing" : "merchant_listing"}
                      contentId={item.listingId}
                      field="subtitle"
                      originalText={item.subtitle}
                    />
                  </p>
                ) : null}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="truncate text-meta font-medium text-slate-200/95">{item.footer}</span>
                  {item.meta ? <span className={`shrink-0 tabular-nums ${D.trustTokenPill}`}>{item.meta}</span> : null}
                </div>
                {!previewOnly ? (
                  <span
                    className={`${touchTargetLink44Classes} ${TT_MARKETING_MARKET_DARK_PATH.masonryCtaLink} ${travelFocusRingOffset2Classes}`}
                  >
                    {t("market_subsite_card_view_detail")}
                  </span>
                ) : null}
              </div>
            </>
          );

          return (
            <li key={item.listingId} className="mb-4 break-inside-avoid" data-listing-id={item.listingId}>
              {previewOnly ? (
                <div className={cardFrame} data-tt-market-masonry-preview-only="1">
                  {cardInner}
                </div>
              ) : externalHref ? (
                <Link href={externalHref} className={`${cardFrame} ${linkRing}`}>
                  {cardInner}
                </Link>
              ) : onListingOpen ? (
                <button
                  type="button"
                  className={drawerCardButtonClass}
                  onClick={() => onListingOpen(item.listingId)}
                  aria-label={`${item.title} — ${t("market_subsite_card_view_detail")}`}
                >
                  {cardInner}
                </button>
              ) : (
                <Link href={fullHref} className={`${cardFrame} ${linkRing}`}>
                  {cardInner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default memo(MarketSubsiteMasonry);
