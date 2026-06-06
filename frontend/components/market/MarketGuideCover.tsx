"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { marketCoverGradientClass, resolveGuideAvatarUrl } from "@/lib/marketMediaFallback";
import type { GuideCardItem } from "@/lib/marketTypes";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

type Props = {
  guide: GuideCardItem;
  glass?: boolean;
  /** glass 列表卡：压低人像区高度（双栏 L5） */
  compact?: boolean;
  avatarAlt: string;
  name: string;
  cityLabel: string;
  hourlyChip: string | null;
  coverEager?: boolean;
};

export function MarketGuideCover({
  guide,
  glass,
  compact = false,
  avatarAlt,
  name,
  cityLabel,
  hourlyChip,
  coverEager = false,
}: Props) {
  const p = TT_MARKETING_MARKET_DARK_PATH;
  const resolvedUrl = resolveGuideAvatarUrl(guide);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    setLoadFailed(false);
  }, [resolvedUrl]);

  const showImage = Boolean(resolvedUrl) && !loadFailed;
  const mediaArea = glass && compact ? p.cardMediaAreaCompact : p.cardMediaArea;
  const mediaClass = glass
    ? showImage
      ? mediaArea
      : `${mediaArea} bg-gradient-to-br ${marketCoverGradientClass(guide.id)}`
    : "relative aspect-[4/3] bg-bg-soft overflow-hidden";

  const initial = (guide.city?.trim().charAt(0) || name.trim().charAt(0) || "?").toUpperCase();

  const inner = showImage ? (
    <>
      <Image
        src={resolvedUrl}
        alt={avatarAlt}
        fill
        className={`object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04] ${compact ? "object-[center_28%]" : "object-[center_20%]"}`}
        sizes="(max-width: 768px) 100vw, 320px"
        unoptimized
        priority={coverEager}
        loading={coverEager ? undefined : "lazy"}
        onError={() => setLoadFailed(true)}
      />
      {glass ? <div className={p.cardCoverScrim} aria-hidden /> : null}
      {glass && hourlyChip ? (
        <div className="absolute bottom-2 left-2 z-[2] pointer-events-none">
          <span className={p.cardCoverChip}>{hourlyChip}</span>
        </div>
      ) : null}
    </>
  ) : (
    <div
      className={
        glass
          ? `relative flex h-full min-h-[10rem] flex-col items-center justify-center gap-3 p-4 bg-gradient-to-br ${marketCoverGradientClass(guide.id)}`
          : "w-full h-full flex items-center justify-center bg-bg-soft"
      }
    >
      <div className={glass ? p.cardMediaAvatarFallback : "w-20 h-20 rounded-full flex items-center justify-center text-h3 font-semibold bg-travel-500/20 text-travel-500"}>
        {initial}
      </div>
      {glass ? (
        <>
          <p className={`${p.cardCoverPlaceholderTitle} text-center`}>{name}</p>
          {cityLabel ? <p className="text-meta text-slate-300/90">{cityLabel}</p> : null}
        </>
      ) : null}
    </div>
  );

  return <div className={mediaClass}>{inner}</div>;
}
