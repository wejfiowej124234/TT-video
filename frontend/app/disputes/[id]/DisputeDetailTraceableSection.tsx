"use client";

import type { FormEvent } from "react";
import { TT_DISPUTES_L5 } from "@/lib/me/disputesL5";
import type { DisputeDetail } from "./disputeDetailPageTypes";
import { DISPUTE_DETAIL_SECTION_CLASS } from "./disputeDetailChrome";
import type { DisputeDetailPageModel } from "./useDisputeDetailPage";

type Props = Pick<
  DisputeDetailPageModel,
  "t" | "explorerTxUrl" | "txHashCopied" | "copyTxBusy" | "copyTxHash" | "disputeTraceableHeadingId"
> & { dispute: DisputeDetail };

export function DisputeDetailTraceableSection({
  t,
  dispute,
  disputeTraceableHeadingId,
  explorerTxUrl,
  txHashCopied,
  copyTxBusy,
  copyTxHash,
}: Props) {
  return (
    <section className={DISPUTE_DETAIL_SECTION_CLASS} aria-labelledby={disputeTraceableHeadingId}>
      <h2 id={disputeTraceableHeadingId} className={TT_DISPUTES_L5.sectionHeading}>
        {t("dispute_traceableSection")}
      </h2>
      <dl className="space-y-2 font-mono text-small text-slate-300/95">
        {dispute.resolution_tx_hash ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <dt className="inline shrink-0 font-medium text-slate-400">{t("dispute_txHashLabel")}</dt>
              <dd className="inline min-w-0 break-all">{dispute.resolution_tx_hash}</dd>
              <span className="flex shrink-0 gap-1">
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    void copyTxHash(dispute.resolution_tx_hash!);
                  }}
                >
                  <button
                    type="submit"
                    disabled={copyTxBusy}
                    aria-busy={copyTxBusy ? true : undefined}
                    className={TT_DISPUTES_L5.btnSecondary}
                    aria-label={t("dispute_copyTxHash")}
                  >
                    {txHashCopied ? t("dispute_txHashCopied") : t("dispute_copyTxHash")}
                  </button>
                </form>
                {explorerTxUrl ? (
                  <a
                    href={`${explorerTxUrl}${dispute.resolution_tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={TT_DISPUTES_L5.listLink}
                  >
                    {t("escrow_viewTx")}
                  </a>
                ) : null}
              </span>
            </div>
            {dispute.resolution_block_number != null ? (
              <div>
                <dt className="inline font-medium text-slate-400">{t("dispute_blockNumberLabel")}</dt>
                <dd className="ml-2 inline">{String(dispute.resolution_block_number)}</dd>
              </div>
            ) : null}
          </>
        ) : (
          <p className={TT_DISPUTES_L5.sectionMeta}>{t("dispute_traceablePending")}</p>
        )}
      </dl>
    </section>
  );
}
