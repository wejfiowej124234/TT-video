"use client";

import { useId, useState, useRef } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { getIdempotencyKey, postOrderConfirmFinalPlan } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { escrowExperiencePrimaryCtaClass, escrowExperienceSecondaryBtnClass } from "@/lib/escrowExperienceUi";
import EscrowDraftTrustPayStrip from "./EscrowDraftTrustPayStrip";
import { escrowProtocolPillFocusClass } from "@/lib/escrowProtocolUi";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export type ConfirmPlanSummaryLine = {
  label: string;
  amount: string;
};

export type ConfirmPlanSummary = {
  destination?: string;
  city?: string;
  days?: number;
  totalDisplay: string;
  currency: string;
  breakdownLines?: ConfirmPlanSummaryLine[];
};

export interface ConfirmFinalPlanBlockProps {
  orderId: string;
  allowConfirmFinalPlan: boolean;
  hasSnapshot: boolean;
  version?: number | null;
  snapshotHash?: string | null;
  onConfirmed: () => void;
  /** 嵌入订单协议区（深色）时顶部分隔线与面板一致 */
  variantDid?: boolean;
  variantExperience?: boolean;
  /** B-067 */
  protocolPaused?: boolean;
  /** Experience draft: full-width primary CTA in quote card */
  primaryFullWidth?: boolean;
  confirmPlanSummary?: ConfirmPlanSummary | null;
  /** 未满足前置条件时禁用确认（须先保存行程等） */
  confirmBlocked?: boolean;
  /** i18n key for blocked reason (e.g. escrow_confirmBlocked_saveFirst) */
  confirmBlockedReasonKey?: string | null;
  /** 就绪条已展示时隐藏按钮下重复短提示 */
  suppressCtaHint?: boolean;
}

export default function ConfirmFinalPlanBlock({
  orderId,
  allowConfirmFinalPlan,
  hasSnapshot,
  version,
  snapshotHash,
  onConfirmed,
  variantDid,
  variantExperience = false,
  protocolPaused = false,
  primaryFullWidth = false,
  confirmPlanSummary = null,
  confirmBlocked = false,
  confirmBlockedReasonKey = null,
  suppressCtaHint = false,
}: ConfirmFinalPlanBlockProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const confirmIdempotencyKeyRef = useRef<string | null>(null);
  const dialogTitleId = useId();
  const dialogDescId = useId();
  const dialogDetailsId = useId();
  const blockedReasonId = useId();
  if (!allowConfirmFinalPlan || hasSnapshot) return null;

  const submitDisabled = protocolPaused || loading || confirmBlocked;
  const blockedReason =
    confirmBlocked && confirmBlockedReasonKey ? t(confirmBlockedReasonKey) : null;

  const handleOpenModal = () => {
    if (protocolPaused || confirmBlocked) return;
    setShowModal(true);
  };
  const handleConfirm = () => {
    if (protocolPaused) return;
    setLoading(true);
    setError(null);
    const expectedVersion = version ?? 1;
    const key = confirmIdempotencyKeyRef.current ?? (confirmIdempotencyKeyRef.current = getIdempotencyKey());
    void (async () => {
      try {
        const { ok, status, data } = await postOrderConfirmFinalPlan(
          orderId,
          { expected_version: expectedVersion },
          key
        );
        if (ok && data.status === "ok") {
          setShowModal(false);
          onConfirmed();
        } else {
          const errCode = data.error ?? "";
          if (errCode && typeof window !== "undefined") {
            console.error("ConfirmFinalPlanBlock API error:", errCode, { status, ok });
          }
          setError(mapApiReadError(errCode ? new Error(errCode) : new Error("unknown"), t, "escrow_confirmFailed"));
          if (status === 409 && errCode === "version_conflict") onConfirmed();
        }
      } catch (err) {
        if (typeof window !== "undefined") {
          console.error("ConfirmFinalPlanBlock fetch:", err);
        }
        setError(mapApiReadError(err, t, "escrow_confirmFailed"));
      } finally {
        setLoading(false);
      }
    })();
  };

  const isExperience = !!variantExperience;
  const isDid = !!variantDid && !isExperience;
  const topBorder = isExperience ? "border-ref-sun/25" : isDid ? "border-ref-sun/14" : "border-ink-200";
  const outerPillFocus = isExperience
    ? `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950`
    : isDid
      ? escrowProtocolPillFocusClass
      : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const confirmBtnClass =
    isExperience && primaryFullWidth
      ? confirmBlocked && !loading
        ? `${escrowExperienceSecondaryBtnClass} w-full min-h-[48px] py-3 text-body font-semibold cursor-not-allowed`
        : escrowExperiencePrimaryCtaClass
      : isExperience
        ? "btn-console rounded-[var(--radius-sm)] bg-ref-sun/90 text-ink-950 px-3 py-1.5 text-small font-semibold hover:bg-ref-sun disabled:opacity-50"
        : "btn-console rounded-[var(--radius-sm)] bg-success px-3 py-1.5 text-white text-small disabled:opacity-50";
  const modalPillFocus = isExperience
    ? `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950`
    : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const modalCancelClass = isExperience
    ? `rounded-[var(--radius-sm)] border border-white/25 bg-transparent px-4 py-2 text-small text-white/90 hover:bg-white/10 ${modalPillFocus}`
    : `btn-console rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-ink-700 ${modalPillFocus}`;
  const modalConfirmClass = isExperience
    ? `${escrowExperiencePrimaryCtaClass} px-4 py-2 text-small min-h-[44px] ${modalPillFocus}`
    : `btn-console rounded-[var(--radius-sm)] bg-success px-4 py-2 text-white text-small disabled:opacity-50 ${modalPillFocus}`;

  return (
    <div className={`${primaryFullWidth ? "mt-4 pt-4" : "mt-3 pt-3"} border-t ${topBorder}`}>
      {protocolPaused ? (
        <p className={isDid ? "text-small text-amber-200/95 mb-2" : "text-small text-warning mb-2"} role="status">
          {t("escrow_protocolPause_body")}
        </p>
      ) : null}
      <form
        className="contents"
        onSubmit={(e) => {
          e.preventDefault();
          handleOpenModal();
        }}
      >
        <button
          type="submit"
          disabled={submitDisabled}
          title={
            protocolPaused
              ? t("escrow_protocolPause_title")
              : confirmBlocked && blockedReason
                ? blockedReason
                : undefined
          }
          aria-busy={loading ? true : undefined}
          aria-disabled={submitDisabled ? true : undefined}
          aria-describedby={blockedReason ? blockedReasonId : undefined}
          className={`${confirmBtnClass} ${outerPillFocus} ${confirmBlocked && !isExperience ? "opacity-55 cursor-not-allowed" : ""}`}
        >
          {loading ? t("common_submitting") : t("escrow_confirmFinalPlan")}
        </button>
      </form>
      {blockedReason ? (
        <p id={blockedReasonId} className="text-meta text-white/70 mt-2 leading-relaxed" role="status">
          {blockedReason}
        </p>
      ) : isExperience && primaryFullWidth && !suppressCtaHint ? (
        <p className="text-meta text-white/70 mt-2 leading-relaxed" role="note">
          {t("escrow_quoteSummaryCtaHint_short")}
        </p>
      ) : null}
      {error && (
        <p className="text-small text-danger mt-1" role="alert">
          {error}
        </p>
      )}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          aria-describedby={`${dialogDescId} ${dialogDetailsId}`}
        >
          <div
            className={
              isExperience
                ? "w-full max-w-md rounded-[var(--radius-md)] border border-ref-sun/28 bg-gradient-to-b from-[#1a1410] via-[#14100c] to-ink-950 p-6 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.65)] space-y-4 text-slate-100"
                : "w-full max-w-md rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-strong space-y-4"
            }
          >
            <h3
              id={dialogTitleId}
              className={
                isExperience
                  ? "text-body-l font-semibold text-ref-sun/95"
                  : "text-body-l font-semibold text-ink-900"
              }
            >
              {t("escrow_confirmFinalPlanTitle")}
            </h3>
            <p
              id={dialogDescId}
              className={isExperience ? "text-small text-white/75 leading-relaxed" : "text-small text-ink-600"}
            >
              {isExperience && confirmPlanSummary
                ? t("escrow_confirmModal_lockNote")
                : t("escrow_confirmFinalPlanDesc")}
            </p>
            {protocolPaused ? (
              <p className="text-small text-warning" role="status">
                {t("escrow_protocolPause_body")}
              </p>
            ) : null}
            {isExperience && confirmPlanSummary ? (
              <div
                id={dialogDetailsId}
                className="text-small space-y-2 rounded-[var(--radius-sm)] border border-ref-sun/15 bg-black/30 p-3 text-white/85"
              >
                <p className="font-medium text-ref-sun/95">{t("escrow_confirmModal_summaryHeading")}</p>
                <p>
                  {t("escrow_confirmModal_destination")
                    .replace("{{dest}}", confirmPlanSummary.destination?.trim() || "—")
                    .replace("{{city}}", confirmPlanSummary.city?.trim() || "—")
                    .replace("{{days}}", String(confirmPlanSummary.days ?? 1))}
                </p>
                {confirmPlanSummary.breakdownLines && confirmPlanSummary.breakdownLines.length > 0 ? (
                  <ul className="space-y-1 tabular-nums list-none p-0 m-0" role="list">
                    {confirmPlanSummary.breakdownLines.map((line) => (
                      <li key={line.label} className="flex justify-between gap-3">
                        <span className="text-white/70">{line.label}</span>
                        <span className="font-medium text-white/90 shrink-0">
                          {line.amount} {confirmPlanSummary.currency}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="font-semibold tabular-nums text-ref-sun/95 pt-1 border-t border-ref-sun/15">
                  {t("escrow_confirmModal_total")
                    .replace("{{amount}}", confirmPlanSummary.totalDisplay)
                    .replace("{{currency}}", confirmPlanSummary.currency)}
                </p>
              </div>
            ) : (
              <ul
                id={dialogDetailsId}
                className="text-small space-y-1 font-mono bg-bg-soft p-3 rounded-[var(--radius-sm)]"
              >
                <li><span className="text-ink-500">{t("escrow_versionLabel")}</span>v{version ?? "1.0"}</li>
                <li><span className="text-ink-500">{t("escrow_snapshotHashLabel")}</span>{snapshotHash ? <span className="break-all">{snapshotHash}</span> : t("escrow_snapshotGeneratedLater")}</li>
                <li className="text-ink-500 pt-1">{t("escrow_eip712Note")}</li>
              </ul>
            )}
            {isExperience && confirmPlanSummary ? <EscrowDraftTrustPayStrip variant="modal" /> : null}
            <div className="flex gap-3 justify-end">
              <form
                className="contents"
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowModal(false);
                  setError(null);
                }}
              >
                <button type="submit" className={modalCancelClass}>
                  {t("common_cancel")}
                </button>
              </form>
              <form
                className="contents"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (protocolPaused) return;
                  handleConfirm();
                }}
              >
                <button
                  type="submit"
                  disabled={protocolPaused || loading}
                  aria-busy={loading ? true : undefined}
                  className={`${modalConfirmClass} disabled:opacity-50`}
                >
                  {loading ? t("common_submitting") : t("escrow_confirmAndSubmit")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
