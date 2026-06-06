"use client";

import type { FormEvent } from "react";
import EvidenceSignedLinkControl from "@/components/order/EvidenceSignedLinkControl";
import { TT_DISPUTES_L5 } from "@/lib/me/disputesL5";
import type { DisputeDetail } from "./disputeDetailPageTypes";
import type { DisputeDetailPageModel } from "./useDisputeDetailPage";
import { DISPUTE_DETAIL_SECTION_CLASS } from "./disputeDetailChrome";

type Props = Pick<
  DisputeDetailPageModel,
  | "t"
  | "orderEvidence"
  | "orderEvidenceListFetch"
  | "orderEvidenceListError"
  | "onOrderEvidenceRetry"
  | "evidenceHash"
  | "setEvidenceHash"
  | "evidenceSubmitting"
  | "evidenceError"
  | "handleEvidenceSubmit"
  | "disputeEvidenceHashInputId"
> & {
  dispute: DisputeDetail;
  isResolved: boolean;
};

export function DisputeDetailEvidenceSection({
  t,
  dispute,
  isResolved,
  orderEvidence,
  orderEvidenceListFetch,
  orderEvidenceListError,
  onOrderEvidenceRetry,
  evidenceHash,
  setEvidenceHash,
  evidenceSubmitting,
  evidenceError,
  handleEvidenceSubmit,
  disputeEvidenceHashInputId,
}: Props) {
  return (
    <section className={DISPUTE_DETAIL_SECTION_CLASS}>
      <h2 className={TT_DISPUTES_L5.sectionHeading}>{t("dispute_evidence")}</h2>
      {dispute.order_id && (orderEvidenceListFetch === "loading" || orderEvidenceListFetch === "idle") ? (
        <p className={`${TT_DISPUTES_L5.sectionMeta} mb-4`} role="status">
          {t("common_loading")}
        </p>
      ) : null}
      {dispute.order_id && orderEvidenceListFetch === "error" && orderEvidenceListError ? (
        <div className="mb-4 space-y-2">
          <p className="text-small text-danger" role="alert">
            {orderEvidenceListError}
          </p>
          <button type="button" onClick={onOrderEvidenceRetry} className={TT_DISPUTES_L5.btnSecondary}>
            {t("common_retry")}
          </button>
        </div>
      ) : null}
      {dispute.order_id && orderEvidenceListFetch === "ready" ? (
        orderEvidence.length > 0 || (dispute.evidence_hashes && dispute.evidence_hashes.length > 0) ? (
          <ul className="mb-4 list-none space-y-2 p-0 m-0 font-mono text-small">
            {orderEvidence.map((r, i) => (
              <li key={i} className="flex flex-wrap items-start gap-2 gap-y-1">
                <span className="min-w-0 flex-1 break-all text-slate-300/95">
                  {r.content_hash}
                  {r.created_at ? <span className="ml-2 text-slate-500">{r.created_at}</span> : null}
                </span>
                {dispute.order_id ? (
                  <EvidenceSignedLinkControl orderId={dispute.order_id} contentHash={r.content_hash} variant="light" />
                ) : null}
              </li>
            ))}
            {dispute.evidence_hashes
              ?.filter((h) => !orderEvidence.some((r) => r.content_hash === h))
              .map((h, i) => (
                <li key={`d-${i}`} className="break-all text-slate-300/95">
                  {h}
                </li>
              ))}
          </ul>
        ) : (
          <p className={`${TT_DISPUTES_L5.sectionMeta} mb-4`}>{t("dispute_noEvidence")}</p>
        )
      ) : null}
      {!isResolved && dispute.order_id ? (
        <div className={TT_DISPUTES_L5.divider}>
          <p className={`${TT_DISPUTES_L5.sectionBody} mb-2`}>{t("dispute_uploadEvidence")}</p>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              handleEvidenceSubmit();
            }}
          >
            <label htmlFor={disputeEvidenceHashInputId} className="sr-only">
              {t("dispute_evidencePlaceholder")}
            </label>
            <input
              id={disputeEvidenceHashInputId}
              type="text"
              value={evidenceHash}
              onChange={(e) => setEvidenceHash(e.target.value)}
              placeholder={t("dispute_evidencePlaceholder")}
              className={`${TT_DISPUTES_L5.input} w-64`}
            />
            <button
              type="submit"
              disabled={evidenceSubmitting || !evidenceHash.trim()}
              aria-busy={evidenceSubmitting ? true : undefined}
              className={TT_DISPUTES_L5.btnPrimary}
            >
              {evidenceSubmitting ? t("dispute_uploading") : t("dispute_upload")}
            </button>
          </form>
          {evidenceError ? <p className="mt-1 text-small text-danger">{evidenceError}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
