"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

/** 商家/收购等未接入榜 · L5 空态（与主榜暖描边同族） */
export function DidRankBoardPlaceholderEmpty({
  icon,
  message,
  roadmap,
  ctaHref,
  ctaLabel,
  onCtaClick,
  aside,
  accentClass = "border-ref-sun/18 bg-ref-sun/8 text-ref-sun",
}: {
  icon: ReactNode;
  message: string;
  roadmap?: string;
  ctaHref: string;
  ctaLabel: string;
  onCtaClick?: () => void;
  aside?: ReactNode;
  accentClass?: string;
}) {
  return (
    <div className="space-y-4">
      {aside}
      <div className={TT_MARKETING_DID_RANK_SURFACE.emptyPanelL5} role="status">
        <div
          className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border text-2xl ${accentClass}`}
          aria-hidden
        >
          {icon}
        </div>
        <p className="text-small text-slate-200/95 max-w-md mx-auto">{message}</p>
        {roadmap ? (
          <p className="text-meta text-slate-400/95 max-w-lg mx-auto mt-2 leading-relaxed">{roadmap}</p>
        ) : null}
        <Link
          href={ctaHref}
          onClick={onCtaClick}
          className={`mt-5 inline-flex ${touchTargetLink44Classes} font-medium text-small text-ref-sun hover:text-ref-coral motion-sub ${deepShellInlineLinkFocusClasses}`}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
