"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { marketCoverGradientClass, resolveMarketOrderCoverUrl } from "@/lib/marketMediaFallback";
import type { OrderCardItem } from "@/lib/marketTypes";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

type Props = {
  item: OrderCardItem;
  glass?: boolean;
  imageAlt: string;
  destLabel: string;
  cityLabel: string;
  daysLabel: string;
  amountLabel: string;
  statusLabel: string;
  statusOverlayClass: string;
  /** 与天数/金额 chip 同排，避免与右上角收藏竖叠 */
  coverFooterExtra?: ReactNode;
  /** 首屏前几卡 eager，其余 lazy（不改视觉） */
  coverEager?: boolean;
};

export function MarketOrderCover({
  item,
  glass,
  imageAlt,
  destLabel,
  cityLabel,
  daysLabel,
  amountLabel,
  statusLabel,
  statusOverlayClass,
  coverFooterExtra,
  coverEager = false,
}: Props) {
  const p = TT_MARKETING_MARKET_DARK_PATH;
  const resolvedUrl = resolveMarketOrderCoverUrl(item);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    setLoadFailed(false);
  }, [resolvedUrl]);

  const showImage = Boolean(resolvedUrl) && !loadFailed;
  const mediaClass = glass
    ? showImage
      ? p.cardMediaArea
      : `${p.cardMediaArea} bg-gradient-to-br ${marketCoverGradientClass(item.id)}`
    : "relative aspect-[4/3] bg-bg-soft overflow-hidden";

  const inner = showImage ? (
    <>
      <Image
        src={resolvedUrl}
        alt={imageAlt}
        fill
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        sizes="(max-width: 768px) 100vw, 400px"
        unoptimized
        priority={coverEager}
        loading={coverEager ? undefined : "lazy"}
        onError={() => setLoadFailed(true)}
      />
      {glass ? <div className={p.cardCoverScrim} aria-hidden /> : null}
      {glass ? (
        <div className="absolute bottom-2 left-2 right-2 z-[2] flex flex-wrap items-center gap-1.5 pointer-events-none">
          {coverFooterExtra}
          {daysLabel ? <span className={p.cardCoverChip}>{daysLabel}</span> : null}
          {amountLabel ? <span className={`${p.cardCoverChip} font-semibold tabular-nums`}>{amountLabel}</span> : null}
        </div>
      ) : null}
    </>
  ) : (
    <div
      className={
        glass
          ? `relative flex h-full min-h-[10rem] flex-col justify-end p-4 bg-gradient-to-br ${marketCoverGradientClass(item.id)}`
          : "w-full h-full flex items-center justify-center text-slate-400 text-body"
      }
    >
      {glass ? (
        <>
          <p className={p.cardCoverPlaceholderTitle}>{destLabel}</p>
          {cityLabel ? <p className="mt-1 text-meta text-slate-300/90">{cityLabel}</p> : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {daysLabel ? <span className={p.cardCoverChip}>{daysLabel}</span> : null}
            {amountLabel ? <span className={p.cardCoverChip}>{amountLabel}</span> : null}
          </div>
        </>
      ) : (
        cityLabel
      )}
    </div>
  );

  return (
    <div className={mediaClass}>
      {inner}
      <div className="absolute top-2 left-2 z-10 pointer-events-none">
        <span className={`rounded-[var(--radius-sm)] px-2 py-0.5 text-meta font-medium shadow-medium ${statusOverlayClass}`}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
