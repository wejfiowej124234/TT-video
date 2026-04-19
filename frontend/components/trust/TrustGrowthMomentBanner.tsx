"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTrustGrowthEvent, type TrustGrowthMoment } from "@/lib/trustGrowthAnalytics";
import {
  resolveTrustGrowthCopyKeys,
  useTrustGrowthAnalyticsExtras,
  useTrustGrowthExperiment,
} from "@/lib/trustGrowthExperiment";
import { deepShellPillControlFocusClasses, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export const PGROW1_ESCROW_DISMISS_STORAGE = "tt_pgrow1_escrow_banner_dismissed_v1";

export type TrustGrowthMomentBannerProps = {
  moment: TrustGrowthMoment;
  surface: "auth" | "ink" | "slate";
  /** 合并进埋点（如 claimable_gt_zero） */
  analyticsPayload?: Record<string, string | number | boolean | undefined>;
  /** 可关闭（仅托管订单等场景）；关闭时写 storageKey */
  dismissible?: boolean;
  storageKey?: string;
};

function shellClass(surface: TrustGrowthMomentBannerProps["surface"]): string {
  if (surface === "slate") {
    return "rounded-[var(--radius-md)] border border-emerald-500/30 bg-emerald-950/25 px-3 py-3 sm:px-4";
  }
  if (surface === "auth") {
    return "rounded-[var(--radius-md)] border border-travel-200 bg-travel-50/80 px-3 py-3 sm:px-4";
  }
  return "rounded-[var(--radius-md)] border border-ink-200 bg-white/95 px-3 py-3 sm:px-4";
}

function textTitle(surface: TrustGrowthMomentBannerProps["surface"]): string {
  if (surface === "slate") return "text-small font-semibold text-emerald-200";
  if (surface === "auth") return "text-small font-semibold text-travel-900";
  return "text-small font-semibold text-ink-900";
}

function textBody(surface: TrustGrowthMomentBannerProps["surface"]): string {
  if (surface === "slate") return "text-meta text-slate-300 leading-relaxed";
  if (surface === "auth") return "text-meta text-ink-700 leading-relaxed";
  return "text-meta text-ink-700 leading-relaxed";
}

function textLi(surface: TrustGrowthMomentBannerProps["surface"]): string {
  if (surface === "slate") return "text-meta text-slate-300";
  if (surface === "auth") return "text-meta text-ink-600";
  return "text-meta text-ink-600";
}

function linkClass(surface: TrustGrowthMomentBannerProps["surface"]): string {
  const base = `font-medium underline motion-sub ${travelFocusRingOffset2Classes}`;
  if (surface === "slate") return `${base} text-cyan-300 hover:text-cyan-100`;
  if (surface === "auth") return `${base} text-travel-700 hover:text-travel-900`;
  return `${base} text-cyan-700 hover:text-cyan-900`;
}

function dismissClass(surface: TrustGrowthMomentBannerProps["surface"]): string {
  const base = `text-meta underline ${travelFocusRingOffset2Classes}`;
  if (surface === "slate") return `${base} text-slate-400 hover:text-slate-200`;
  return `${base} text-ink-500 hover:text-ink-800`;
}

function summaryClass(surface: TrustGrowthMomentBannerProps["surface"]): string {
  if (surface === "slate") {
    return `cursor-pointer list-none text-left text-small font-semibold text-emerald-200 [&::-webkit-details-marker]:hidden min-h-[44px] flex items-center rounded-sm -mx-1 px-1 ${deepShellPillControlFocusClasses}`;
  }
  if (surface === "auth") {
    return `cursor-pointer list-none text-left text-small font-semibold text-travel-900 [&::-webkit-details-marker]:hidden min-h-[44px] flex items-center ${travelFocusRingOffset2Classes}`;
  }
  return `cursor-pointer list-none text-left text-small font-semibold text-ink-900 [&::-webkit-details-marker]:hidden min-h-[44px] flex items-center ${travelFocusRingOffset2Classes}`;
}

/**
 * P-GROW1 / P-GROW2：信任增长条 — 实验分流、延迟展示、证据条数、折叠；曝光与点击带 variant 维度的埋点。
 */
export default function TrustGrowthMomentBanner({
  moment,
  surface,
  analyticsPayload,
  dismissible = false,
  storageKey = PGROW1_ESCROW_DISMISS_STORAGE,
}: TrustGrowthMomentBannerProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const viewed = useRef(false);
  const [hidden, setHidden] = useState(false);
  const [storageReady, setStorageReady] = useState(!dismissible);
  const [delayDone, setDelayDone] = useState(false);

  const exp = useTrustGrowthExperiment(moment);
  const expExtras = useTrustGrowthAnalyticsExtras(exp, moment);

  const fullPayload = useMemo(
    () => ({ ...analyticsPayload, ...expExtras }),
    [analyticsPayload, expExtras]
  );
  const payloadRef = useRef(fullPayload);
  payloadRef.current = fullPayload;

  useEffect(() => {
    if (!dismissible) return;
    try {
      if (window.localStorage.getItem(storageKey) === "1") setHidden(true);
    } catch {
      /* ignore */
    }
    setStorageReady(true);
  }, [dismissible, storageKey]);

  useEffect(() => {
    if (!exp.ready || !exp.variant) return;
    const ms = exp.variant.delayMs;
    if (ms <= 0) {
      setDelayDone(true);
      return;
    }
    setDelayDone(false);
    const id = window.setTimeout(() => setDelayDone(true), ms);
    return () => window.clearTimeout(id);
  }, [exp.ready, exp.variant, moment]);

  useEffect(() => {
    if (!storageReady || hidden || !exp.ready || !delayDone) return;
    if (viewed.current) return;
    viewed.current = true;
    trackTrustGrowthEvent("trust_growth_moment_view", { moment, ...payloadRef.current });
  }, [moment, hidden, storageReady, exp.ready, delayDone]);

  if (!exp.ready || !exp.variant || !storageReady || hidden || !delayDone) return null;

  const v = exp.variant;
  const k = resolveTrustGrowthCopyKeys(moment, v.copyModule);
  const evidenceKeys = [k.e1, k.e2, k.e3].slice(0, v.evidenceCount);

  function onDismiss() {
    trackTrustGrowthEvent("trust_growth_moment_dismiss", { moment, ...payloadRef.current });
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  }

  function onDetailsToggle(open: boolean) {
    trackTrustGrowthEvent("trust_growth_details_toggle", {
      moment,
      details_open: open,
      ...payloadRef.current,
    });
  }

  const bodyBlock = (
    <>
      <p className={`${textBody(surface)} mt-1`}>{t(k.lead)}</p>
      <ul className={`mt-2 list-inside list-disc space-y-0.5 ${textLi(surface)}`}>
        {evidenceKeys.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
      <p className={`${textBody(surface)} mt-3`}>
        <Link
          href="/trust"
          className={linkClass(surface)}
          onClick={() =>
            trackTrustGrowthEvent("trust_growth_trust_hub_click", {
              moment,
              placement: "pgrow1_banner",
              ...payloadRef.current,
            })
          }
        >
          {t("pgrow1_cta_open_trust_hub")}
        </Link>
      </p>
      {dismissible ? (
        <div className="mt-2">
          <button type="button" className={dismissClass(surface)} onClick={onDismiss}>
            {t("pgrow1_dismiss")}
          </button>
        </div>
      ) : null}
    </>
  );

  const collapsed = !v.defaultExpanded;

  return (
    <aside
      className={shellClass(surface)}
      role="region"
      aria-labelledby={labelId}
      data-pgrow1-moment={moment}
      data-pgrow2-variant={v.id}
    >
      {!collapsed ? (
        <>
          <h2 id={labelId} className={textTitle(surface)}>
            {t(k.title)}
          </h2>
          {bodyBlock}
        </>
      ) : (
        <details
          className="group"
          onToggle={(e) => onDetailsToggle((e.target as HTMLDetailsElement).open)}
        >
          <summary className={summaryClass(surface)}>
            <span id={labelId} className="min-w-0">
              {t(k.title)} <span className="font-normal opacity-90">— {t("pgrow2_details_summary_hint")}</span>
            </span>
          </summary>
          <div
            className={`mt-2 border-t pt-2 ${
              surface === "slate" ? "border-slate-600/50" : surface === "auth" ? "border-travel-200/70" : "border-ink-200"
            }`}
          >
            {bodyBlock}
          </div>
        </details>
      )}
    </aside>
  );
}
