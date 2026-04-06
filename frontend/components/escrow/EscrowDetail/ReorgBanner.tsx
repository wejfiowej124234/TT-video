"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  marketCyanPillControlFocusClasses,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

export interface ReorgBannerProps {
  onRefresh: () => void;
  onDismiss: () => void;
  variantDid?: boolean;
}

export default function ReorgBanner({ onRefresh, onDismiss, variantDid }: ReorgBannerProps) {
  const { t } = useTranslation();
  const isDid = !!variantDid;
  const boxClass = isDid
    ? "rounded-[var(--radius-md)] border border-warning/40 bg-warning/15 backdrop-blur-sm p-4 flex flex-wrap items-center justify-between gap-2"
    : "rounded-[var(--radius-sm)] border border-warning/50 bg-warning/15 p-4 flex flex-wrap items-center justify-between gap-2";
  const textClass = isDid ? "text-small text-warning/95 leading-relaxed" : "text-small text-warning";
  const pillFocusClass = isDid
    ? marketCyanPillControlFocusClasses
    : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const refreshClass = isDid
    ? `btn-console rounded-[var(--radius-sm)] bg-warning/20 border border-warning/50 px-3 py-1.5 text-small text-warning/95 hover:bg-warning/30 ${pillFocusClass}`
    : `btn-console rounded-[var(--radius-sm)] bg-warning/20 border border-warning px-3 py-1.5 text-small text-ink-800 ${pillFocusClass}`;
  const dismissClass = isDid
    ? `btn-console rounded-[var(--radius-sm)] border border-slate-500/60 px-3 py-1.5 text-small text-slate-200 hover:bg-slate-800/50 ${pillFocusClass}`
    : `btn-console rounded-[var(--radius-sm)] border border-ink-300 px-3 py-1.5 text-small text-ink-700 ${pillFocusClass}`;

  return (
    <div className={boxClass} role="alert">
      <p className={textClass}>{t("escrow_reorgBanner")}</p>
      <div className="flex gap-2">
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            onRefresh();
          }}
        >
          <button type="submit" className={refreshClass}>
            {t("escrow_refresh")}
          </button>
        </form>
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            onDismiss();
          }}
        >
          <button type="submit" className={dismissClass}>
            {t("escrow_close")}
          </button>
        </form>
      </div>
    </div>
  );
}
