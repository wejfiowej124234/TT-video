"use client";

import { useId, useState, useRef } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { getIdempotencyKey, postOrderConfirmFinalPlan } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  marketCyanPillControlFocusClasses,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

export interface ConfirmFinalPlanBlockProps {
  orderId: string;
  allowConfirmFinalPlan: boolean;
  hasSnapshot: boolean;
  version?: number | null;
  snapshotHash?: string | null;
  onConfirmed: () => void;
  /** 嵌入订单协议区（深色）时顶部分隔线与面板一致 */
  variantDid?: boolean;
  /** B-067 */
  protocolPaused?: boolean;
}

export default function ConfirmFinalPlanBlock({
  orderId,
  allowConfirmFinalPlan,
  hasSnapshot,
  version,
  snapshotHash,
  onConfirmed,
  variantDid,
  protocolPaused = false,
}: ConfirmFinalPlanBlockProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const confirmIdempotencyKeyRef = useRef<string | null>(null);
  const dialogTitleId = useId();
  const dialogDescId = useId();
  const dialogDetailsId = useId();
  if (!allowConfirmFinalPlan || hasSnapshot) return null;

  const handleOpenModal = () => {
    if (protocolPaused) return;
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

  const topBorder = variantDid ? "border-slate-600/50" : "border-ink-200";
  const isDid = !!variantDid;
  const outerPillFocus = isDid
    ? marketCyanPillControlFocusClasses
    : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const modalPillFocus = `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;

  return (
    <div className={`mt-3 pt-3 border-t ${topBorder}`}>
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
          disabled={protocolPaused || loading}
          title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
          aria-busy={loading ? true : undefined}
          className={`btn-console rounded-[var(--radius-sm)] bg-success px-3 py-1.5 text-white text-small disabled:opacity-50 ${outerPillFocus}`}
        >
          {loading ? t("common_submitting") : t("escrow_confirmFinalPlan")}
        </button>
      </form>
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
          <div className="w-full max-w-md rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-strong space-y-4">
            <h3 id={dialogTitleId} className="text-body-l font-semibold text-ink-900">
              {t("escrow_confirmFinalPlanTitle")}
            </h3>
            <p id={dialogDescId} className="text-small text-ink-600">
              {t("escrow_confirmFinalPlanDesc")}
            </p>
            {protocolPaused ? (
              <p className="text-small text-warning" role="status">
                {t("escrow_protocolPause_body")}
              </p>
            ) : null}
            <ul
              id={dialogDetailsId}
              className="text-small space-y-1 font-mono bg-bg-soft p-3 rounded-[var(--radius-sm)]"
            >
              <li><span className="text-ink-500">{t("escrow_versionLabel")}</span>v{version ?? "1.0"}</li>
              <li><span className="text-ink-500">{t("escrow_snapshotHashLabel")}</span>{snapshotHash ? <span className="break-all">{snapshotHash}</span> : t("escrow_snapshotGeneratedLater")}</li>
              <li className="text-ink-500 pt-1">{t("escrow_eip712Note")}</li>
            </ul>
            <div className="flex gap-3 justify-end">
              <form
                className="contents"
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowModal(false);
                  setError(null);
                }}
              >
                <button type="submit" className={`btn-console rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-ink-700 ${modalPillFocus}`}>
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
                  className={`btn-console rounded-[var(--radius-sm)] bg-success px-4 py-2 text-white text-small disabled:opacity-50 ${modalPillFocus}`}
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
