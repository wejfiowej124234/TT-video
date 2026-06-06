"use client";

import {
  TT_MARKETING_DARK_ROUTE_SURFACE,
  type TTMarketingDarkRouteSurfaceId,
} from "@/lib/marketingUi";

type Props = {
  /** 默认 warm（#14100d）；premium（#0a0a0a）仅 `/market` 试色开关 */
  surface?: TTMarketingDarkRouteSurfaceId;
  /** 覆盖 `TT_MARKETING_DARK_ROUTE_SURFACE[*].atmosphereClass`（如 community 去横纹） */
  atmosphereClass?: string;
};

/**
 * 自由市场 / DID 排行榜 / TT 社区 共用页身底。
 * warm = 现行暖场域；premium = 高级近黑（与 /traveltrust 黑场同族）。
 */
export default function WarmRouteFieldBackdrop({ surface = "warm", atmosphereClass }: Props) {
  const tokens = TT_MARKETING_DARK_ROUTE_SURFACE[surface];
  const atmo = atmosphereClass ?? tokens.atmosphereClass;
  return (
    <>
      <div
        className={`fixed inset-0 z-0 ${tokens.baseClass} pointer-events-none`}
        aria-hidden
        data-tt-market-dark-surface-base={surface}
      />
      <div
        className={`fixed inset-0 z-0 ${atmo} pointer-events-none`}
        aria-hidden
      />
      <div className={`fixed inset-0 z-0 ${tokens.dotGridClass} pointer-events-none`} aria-hidden />
    </>
  );
}
