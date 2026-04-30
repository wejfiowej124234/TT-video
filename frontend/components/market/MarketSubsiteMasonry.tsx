"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import MarketRemoteListingImage from "@/components/market/MarketRemoteListingImage";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export type MarketSubsiteMasonryItem = {
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
};

const cardFrame =
  "overflow-hidden rounded-[var(--radius-lg)] border border-white/15 bg-ink-900/55 shadow-[0_0_24px_-8px_rgba(35,206,217,0.12)] backdrop-blur-md ring-1 ring-ref-cyan/15 transition hover:border-ref-cyan/35 hover:ring-ref-cyan/30 motion-reduce:transition-none motion-reduce:hover:border-white/15 motion-reduce:hover:ring-ref-cyan/15";

/** 勿叠 `touchTargetLink44Classes`（含 inline-flex）在整卡 button 上，否则会变成左图右文；须保持上图下文与原先 Link 一致。 */
const drawerCardButtonClass =
  `${cardFrame} group block w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900`;

const linkRing = `group block focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 ${travelFocusRingOffset2Classes}`;

/** 双列瀑布流（CSS columns）；抽屉模式与旅行预约列表一致。 */
export default function MarketSubsiteMasonry({
  listLabelKey,
  items,
  extraQuery,
  onListingOpen,
  badgeKey = "market_subsite_masonry_demo_badge",
}: Props) {
  const { t } = useTranslation();
  const label = t(listLabelKey);

  return (
    <section className="mx-auto max-w-5xl px-4 py-5 sm:py-6" aria-label={label}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <span className="rounded-[var(--radius-md)] border border-white/15 bg-ink-800/70 px-2.5 py-1 text-meta font-medium tracking-wide text-slate-200/95 ring-1 ring-white/[0.06] w-fit">
          {t(badgeKey)}
        </span>
        <p className="max-w-prose text-meta leading-snug text-slate-400/95 sm:text-right sm:max-w-md" role="note">
          {t("market_subsite_no_post_interactions_hint")}
        </p>
      </div>
      <ul className="columns-1 gap-4 sm:columns-2 [column-fill:_balance]">
        {items.map((item, itemIdx) => {
          const fullHref = extraQuery ? `${item.href}?${extraQuery}` : item.href;
          const externalHref = item.directHref?.trim();
          const cardInner = (
            <>
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-800/80 sm:aspect-[3/4]">
                <MarketRemoteListingImage
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  fill
                  className="object-cover motion-safe:transition motion-safe:duration-300 motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority={itemIdx === 0}
                />
                {item.pill ? (
                  <span className="absolute bottom-2 left-2 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-meta font-medium text-white/95 backdrop-blur-sm">
                    {item.pill}
                  </span>
                ) : null}
              </div>
              <div className="space-y-1.5 p-3.5">
                <h2 className="text-body font-semibold leading-snug text-white line-clamp-2">{item.title}</h2>
                {item.subtitle ? <p className="text-meta leading-snug text-slate-200/90 line-clamp-2">{item.subtitle}</p> : null}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="truncate text-meta font-medium text-slate-200/95">{item.footer}</span>
                  {item.meta ? (
                    <span className="shrink-0 rounded-[var(--radius-md)] bg-warning/15 px-2 py-0.5 text-meta font-semibold tabular-nums text-white/95 ring-1 ring-warning/25">
                      {item.meta}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center pt-1 text-small font-semibold text-cyan-200/95 underline decoration-cyan-400/40 underline-offset-[5px] transition-colors motion-reduce:transition-none group-hover:text-cyan-100 group-hover:decoration-cyan-300/55`}
                >
                  {t("market_subsite_card_view_detail")}
                </span>
              </div>
            </>
          );

          return (
            <li key={item.listingId} className="mb-4 break-inside-avoid">
              {externalHref ? (
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
