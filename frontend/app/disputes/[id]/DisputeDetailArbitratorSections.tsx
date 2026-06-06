"use client";

import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { TT_DISPUTES_L5 } from "@/lib/me/disputesL5";
import type { DisputeDetailPageModel } from "./useDisputeDetailPage";
import { disputeConsoleFocus, DISPUTE_DETAIL_SECTION_CLASS } from "./disputeDetailChrome";

type Props = Pick<
  DisputeDetailPageModel,
  | "t"
  | "meRoleFetch"
  | "onMeRoleRetry"
  | "refundRatio"
  | "setRefundRatio"
  | "slashGuide"
  | "setSlashGuide"
  | "resolveError"
  | "resolveSubmitting"
  | "handleResolve"
  | "disputeRefundRatioInputId"
>;

export function DisputeDetailArbitratorSections({
  t,
  meRoleFetch,
  onMeRoleRetry,
  refundRatio,
  setRefundRatio,
  slashGuide,
  setSlashGuide,
  resolveError,
  resolveSubmitting,
  handleResolve,
  disputeRefundRatioInputId,
}: Props) {
  return (
    <>
      {meRoleFetch.phase === "loading" ? (
        <section className={DISPUTE_DETAIL_SECTION_CLASS}>
          <h2 className={TT_DISPUTES_L5.sectionHeading}>{t("dispute_arbSection")}</h2>
          <p className={TT_DISPUTES_L5.sectionMeta}>{t("common_loading")}</p>
        </section>
      ) : null}
      {meRoleFetch.phase === "failed" ? (
        <section className={DISPUTE_DETAIL_SECTION_CLASS}>
          <h2 className={TT_DISPUTES_L5.sectionHeading}>{t("dispute_arbSection")}</h2>
          <div className="space-y-2">
            <ApiErrorAlert message={t("dispute_meRoleLoadFailed")} />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                onMeRoleRetry();
              }}
            >
              <button type="submit" className={TT_DISPUTES_L5.btnSecondary}>
                {t("common_retry")}
              </button>
            </form>
          </div>
        </section>
      ) : null}
      {meRoleFetch.phase === "ready" && meRoleFetch.role !== "arbitrator" ? (
        <section className={TT_DISPUTES_L5.calloutMuted}>
          <h2 className={TT_DISPUTES_L5.sectionHeading}>{t("dispute_arbSection")}</h2>
          <p className={TT_DISPUTES_L5.sectionBody}>{t("dispute_resolveArbitratorOnly")}</p>
        </section>
      ) : null}
      {meRoleFetch.phase === "ready" && meRoleFetch.role === "arbitrator" ? (
        <section className={TT_DISPUTES_L5.calloutWarning}>
          <h2 className={TT_DISPUTES_L5.sectionHeading}>{t("dispute_arbSection")}</h2>
          <p className={`${TT_DISPUTES_L5.sectionBody} mb-3`}>{t("dispute_arbNote")}</p>
          <form
            className="max-w-xs space-y-3"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              handleResolve();
            }}
          >
            <label htmlFor={disputeRefundRatioInputId} className={`block ${TT_DISPUTES_L5.sectionBody} font-medium`}>
              {t("dispute_refundLabel")}
              <input
                id={disputeRefundRatioInputId}
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={refundRatio}
                onChange={(e) => setRefundRatio(e.target.value)}
                className={`${TT_DISPUTES_L5.input} mt-1 block w-full`}
              />
            </label>
            <label className={`flex items-center gap-2 ${TT_DISPUTES_L5.sectionBody}`}>
              <input
                type="checkbox"
                checked={slashGuide}
                onChange={(e) => setSlashGuide(e.target.checked)}
                className={`rounded border-ref-sun/35 text-ref-sun/90 focus:ring-ref-sun/50 ${disputeConsoleFocus}`}
              />
              {t("dispute_slashLabel")}
            </label>
            {resolveError ? <p className="text-small text-danger">{resolveError}</p> : null}
            <button
              type="submit"
              disabled={resolveSubmitting}
              aria-busy={resolveSubmitting ? true : undefined}
              className={`${TT_DISPUTES_L5.btnPrimary} border-warning/40 bg-warning/20 hover:bg-warning/30`}
            >
              {resolveSubmitting ? t("dispute_uploading") : t("dispute_submitResolve")}
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}
