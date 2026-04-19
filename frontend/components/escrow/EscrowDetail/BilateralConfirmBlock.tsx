"use client";

import { useState, useRef, useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { orderConfirmBilateral, getIdempotencyKey } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  marketCyanPillControlFocusClasses,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

/**
 * 53-S6：双边确认区 — 旅行者/向导各自「确认行程与金额」，双勾后进入「确认·待付款」
 * 与 §4.6.9 G4、§5.2 一致；布局双列或上下两行，已确认打勾+弱化主色
 */
export interface BilateralConfirmBlockProps {
  orderId: string;
  /** 当前用户是否为向导（来自 me.guide） */
  isGuide: boolean;
  /** 旅行者是否已确认（来自 order 或 API） */
  touristConfirmed?: boolean;
  /** 向导是否已确认 */
  guideConfirmed?: boolean;
  onSuccess: () => void;
  /** 53-S4：在协议区时使用 DID 面板样式 */
  variantDid?: boolean;
  /** B-067 */
  protocolPaused?: boolean;
}

export default function BilateralConfirmBlock({
  orderId,
  isGuide,
  touristConfirmed = false,
  guideConfirmed = false,
  onSuccess,
  variantDid,
  protocolPaused = false,
}: BilateralConfirmBlockProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const canConfirm = isGuide ? !guideConfirmed : !touristConfirmed;

  const handleConfirm = async () => {
    if (protocolPaused || !canConfirm) return;
    setError(null);
    setLoading(true);
    const key = idempotencyKeyRef.current ?? (idempotencyKeyRef.current = getIdempotencyKey());
    try {
      await orderConfirmBilateral(orderId, key);
      onSuccess();
    } catch (e) {
      if (typeof window !== "undefined") {
        console.error("BilateralConfirmBlock:", e);
      }
      setError(mapApiReadError(e, t, "order_error_bilateral_failed"));
    } finally {
      setLoading(false);
    }
  };

  const panelClass = variantDid
    ? "rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-4 space-y-4"
    : "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console/60 p-4 space-y-4";
  const labelClass = variantDid ? "text-small font-medium text-cyan-200" : "text-small font-medium text-ink-800";
  const rowClass = variantDid ? "text-small text-slate-300" : "text-small text-ink-700";
  const checkClass = variantDid ? "text-cyan-300" : "text-success";
  const btnClass = variantDid
    ? "btn-console rounded-[var(--radius-sm)] bg-cyan-500/80 hover:bg-cyan-500 px-3 py-1.5 text-white text-small font-medium disabled:opacity-60"
    : "btn-console rounded-[var(--radius-sm)] bg-travel-500 px-3 py-1.5 text-white text-small font-medium disabled:opacity-60";
  const ctaFocusClass = variantDid
    ? marketCyanPillControlFocusClasses
    : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;

  return (
    <section className={panelClass} aria-labelledby={headingId}>
      <h3 id={headingId} className={labelClass}>
        {t("order_bilateralConfirmTitle")}
      </h3>
      <p className={`text-meta mb-3 leading-relaxed ${variantDid ? "text-slate-300" : "text-ink-600"}`}>{t("order_bilateralHint")}</p>
      {protocolPaused ? (
        <p
          className={`text-small mb-3 leading-relaxed ${variantDid ? "text-amber-200/95" : "text-warning"}`}
          role="status"
        >
          {t("escrow_protocolPause_body")}
        </p>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={rowClass}>
          <span className="font-medium">{t("escrow_tourist").replace(": ", "")}</span>
          {touristConfirmed ? (
            <span className={`ml-2 ${checkClass}`} aria-hidden>✓ {t("order_bilateralConfirmed")}</span>
          ) : (
            <span className={`ml-2 ${variantDid ? "text-slate-300" : "text-ink-500"}`}>{t("order_bilateralNotConfirmed")}</span>
          )}
        </div>
        <div className={rowClass}>
          <span className="font-medium">{t("escrow_guide").replace(": ", "")}</span>
          {guideConfirmed ? (
            <span className={`ml-2 ${checkClass}`} aria-hidden>✓ {t("order_bilateralConfirmed")}</span>
          ) : (
            <span className={`ml-2 ${variantDid ? "text-slate-300" : "text-ink-500"}`}>{t("order_bilateralNotConfirmed")}</span>
          )}
        </div>
      </div>
      {error && (
        <p className="text-small text-danger" role="alert">{error}</p>
      )}
      {canConfirm && (
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
        >
          <button
            type="submit"
            disabled={protocolPaused || loading}
            title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
            className={`${btnClass} ${ctaFocusClass}`}
            aria-label={t("order_bilateralConfirmCta")}
            aria-busy={loading ? true : undefined}
          >
            {loading ? t("common_submitting") : t("order_bilateralConfirmCta")}
          </button>
        </form>
      )}
    </section>
  );
}
