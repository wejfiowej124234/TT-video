"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_INDEXER_OPS_HINT_CARD_CLASS } from "@/lib/adminUi";
type AdminIndexerOpsHintCardProps = {
  opsHintId: string;
};

export function AdminIndexerOpsHintCard({ opsHintId }: AdminIndexerOpsHintCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      href="#admin-indexer-reconcile"
      className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start ${ADMIN_INDEXER_OPS_HINT_CARD_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
      aria-labelledby={opsHintId}
      data-tt-admin-indexer-ops-hint="1"
    >
      <h2 id={opsHintId} className="text-small font-semibold uppercase tracking-wide text-ink-600">
        {t("admin_indexer_ops_heading")}
      </h2>
      <p className="mt-2 whitespace-pre-line text-body text-ink-700 leading-relaxed">{t("admin_indexer_ops_hint")}</p>
      <p className="mt-3 text-meta text-ink-600 leading-relaxed">{t("admin_indexer_ops_projection_sync_note")}</p>
    </Link>
  );
}
