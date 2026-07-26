"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  DISPUTE_EVIDENCE_CROSS_CHECK_HREF,
  resolveDisputeEvidenceAuditTrail,
} from "@/lib/admin/disputeOpsL5";
import {
  ADMIN_CONSOLE_MUTED_BLOCK_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
  ADMIN_TEXT_META_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type Props = {
  evidenceHashes: unknown;
  disputeId?: string | null;
};

/** Batch-11 HU-427 · 证据哈希审计 trail（只读 · 深链 cross-check · 非执行 sync） */
export function AdminDisputeEvidenceAuditTrail({ evidenceHashes, disputeId }: Props) {
  const { t } = useTranslation();
  const items = resolveDisputeEvidenceAuditTrail(evidenceHashes);

  return (
    <div
      className="mt-3"
      data-tt-admin-dispute-evidence-trail="1"
      data-tt-admin-dispute-evidence-count={String(items.length)}
    >
      <h3 className="text-meta font-medium text-ink-600">{t("admin_dispute_evidence_trail_title")}</h3>
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_dispute_evidence_trail_lead")}</p>
      {items.length === 0 ? (
        <p
          className={`mt-2 ${ADMIN_CONSOLE_MUTED_BLOCK_CLASS} p-3 text-meta text-ink-600`}
          data-tt-admin-dispute-evidence-empty="1"
        >
          {t("admin_dispute_evidence_trail_empty")}
        </p>
      ) : (
        <ol className="mt-2 space-y-2">
          {items.map((item) => (
            <li
              key={`${item.index}-${item.hash}`}
              className={`${ADMIN_CONSOLE_MUTED_BLOCK_CLASS} break-all p-3 font-mono text-meta text-ink-700`}
              data-tt-admin-dispute-evidence-hash="1"
              data-tt-admin-dispute-evidence-kind={item.kind}
            >
              <span className="text-ink-500">#{item.index}</span> {item.hash}
            </li>
          ))}
        </ol>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        <Link
          href={DISPUTE_EVIDENCE_CROSS_CHECK_HREF}
          className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          data-tt-admin-dispute-evidence-cross-check="1"
        >
          {t("admin_dispute_evidence_cross_check")}
        </Link>
        {disputeId ? (
          <Link
            href={`/disputes/${encodeURIComponent(disputeId)}`}
            className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
            data-tt-admin-dispute-evidence-public="1"
          >
            {t("admin_dispute_evidence_open_public")}
          </Link>
        ) : null}
      </div>
      <p className={`mt-2 ${ADMIN_TEXT_FOOTNOTE_CLASS}`}>{t("admin_dispute_evidence_trail_footnote")}</p>
    </div>
  );
}
