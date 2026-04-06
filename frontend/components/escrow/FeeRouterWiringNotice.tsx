"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { useMeta } from "@/components/MetaProvider";
import { computeFeeRouterWiringUi, shortHexAddr } from "@/lib/feeRouterWiring";
import {
  marketCyanInlineLinkFocusClasses,
  touchTargetLink44Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

export type FeeRouterWiringNoticeVariant = "did" | "light";

/**
 * EscrowFactory.createEscrow 前：展示 platformFeeRecipient（FeeRouter）与 GET /meta、构建变量是否一致。
 * 不一致时 requirePlatformFeeRecipient 将抛错 — 须与 Runbook §7.1 对齐。
 * **`light`**：浅色背景（如 85 `/traveltrust`）；默认 **`did`** 适配协议区深色底。
 */
export default function FeeRouterWiringNotice({
  variant = "did",
}: { variant?: FeeRouterWiringNoticeVariant } = {}) {
  const { t } = useTranslation();
  const { meta, loading, error: metaLoadError } = useMeta();
  const ui = useMemo(() => computeFeeRouterWiringUi(meta), [meta]);
  const light = variant === "light";

  if (loading && !meta) {
    return (
      <div className="py-1" role="status" aria-live="polite">
        <LoadingText className={light ? "text-ink-600" : "text-slate-300"} />
      </div>
    );
  }

  const boxBase = "rounded-[var(--radius-md)] border px-3 py-2.5 text-small leading-snug";

  /** B-052：GET /meta 失败时禁止静默空白；生产短句 + dev 附 mapApiReadError 文案 */
  if (metaLoadError != null) {
    const metaFailBox = light
      ? `${boxBase} border-ink-200/90 bg-ink-50/90 text-ink-900`
      : `${boxBase} border-slate-500/40 bg-slate-900/45 text-white/95`;
    return (
      <div className={metaFailBox} role="status" aria-live="polite">
        <p className={light ? "font-medium text-ink-900" : "font-medium text-white/95"}>
          {t("escrow_feeRouterWiring_metaUnavailable_title")}
        </p>
        <p className={light ? "mt-1 text-meta text-ink-700" : "mt-1 text-meta text-white/80"}>
          {t("escrow_feeRouterWiring_metaUnavailable_body")}
        </p>
        {process.env.NODE_ENV !== "production" ? (
          <p
            className={
              light
                ? "mt-2 font-mono text-meta text-ink-600 break-all"
                : "mt-2 font-mono text-meta text-slate-400 break-all"
            }
          >
            {metaLoadError}
          </p>
        ) : null}
      </div>
    );
  }

  if (ui.mismatch) {
    return (
      <div
        className={
          light
            ? `${boxBase} border-warning/30 bg-warning/10 text-ink-900`
            : `${boxBase} border-warning/45 bg-warning/15 text-white/95`
        }
        role="alert"
      >
        <p className={light ? "font-medium text-ink-900" : "font-medium text-white/95"}>
          {t("escrow_feeRouterWiring_title")}
        </p>
        <p className={light ? "mt-1 text-meta text-ink-700" : "mt-1 text-meta text-white/80"}>
          {t("governance_fee_routes_wiring_mismatch")}
        </p>
        <p
          className={
            light
              ? "mt-1 font-mono text-meta text-ink-800 break-all"
              : "mt-1 font-mono text-meta break-all opacity-95"
          }
        >
          {t("governance_fee_routes_wiring_api")}: {ui.metaRaw ? shortHexAddr(ui.metaRaw) : t("governance_fee_routes_wiring_none")}
        </p>
        <p
          className={
            light
              ? "mt-0.5 font-mono text-meta text-ink-800 break-all"
              : "mt-0.5 font-mono text-meta break-all opacity-95"
          }
        >
          {t("governance_fee_routes_wiring_build")}: {ui.envAddr ? shortHexAddr(ui.envAddr) : t("governance_fee_routes_wiring_none")}
        </p>
        <Link
          href="/governance/fee-routes"
          className={
            light
              ? `mt-2 ${touchTargetLink44Classes} text-meta font-medium text-travel-700 underline underline-offset-2 hover:text-travel-800 ${travelFocusRingOffset2Classes}`
              : `mt-2 ${touchTargetLink44Classes} text-meta text-cyan-300 underline underline-offset-2 hover:text-cyan-100 ${marketCyanInlineLinkFocusClasses}`
          }
        >
          {t("escrow_feeRouterWiring_openGovernance")}
        </Link>
      </div>
    );
  }

  if (ui.neither) {
    return (
      <div
        className={
          light
            ? `${boxBase} border-danger/25 bg-danger/5 text-ink-900`
            : `${boxBase} border-danger/40 bg-danger/10 text-white/95`
        }
        role="status"
      >
        <p className={light ? "font-medium text-ink-900" : "font-medium text-white/95"}>
          {t("escrow_feeRouterWiring_title")}
        </p>
        <p className={light ? "mt-1 text-meta text-ink-700" : "mt-1 text-meta text-white/80"}>
          {t("escrow_feeRouterWiring_unconfigured")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        light
          ? `${boxBase} border-success/25 bg-success/10 text-ink-800`
          : `${boxBase} border-success/35 bg-success/5 text-slate-300`
      }
      role="status"
    >
      <p className={light ? "font-medium text-success" : "font-medium text-success/95"}>
        {t("escrow_feeRouterWiring_title")}
      </p>
      <p className={light ? "mt-1 text-meta text-ink-700" : "mt-1 text-meta text-slate-300"}>
        {t("escrow_feeRouterWiring_ok")}
      </p>
      {ui.metaAddr ? (
        <p
          className={
            light
              ? "mt-1 font-mono text-meta text-ink-600 break-all"
              : "mt-1 font-mono text-meta text-slate-300 break-all"
          }
        >
          {shortHexAddr(ui.metaAddr)}
        </p>
      ) : null}
    </div>
  );
}
