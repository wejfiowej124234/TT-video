"use client";

import Link from "next/link";
import type { FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";
type AdminIndexerReconcileJumpSectionProps = {
  indexerReconcileOpenFilterHintId: string;
  reconcileId: string;
  setReconcileId: (v: string) => void;
  onOpenReport: (trimmedId: string) => void;
};

export function AdminIndexerReconcileJumpSection({
  indexerReconcileOpenFilterHintId,
  reconcileId,
  setReconcileId,
  onOpenReport,
}: AdminIndexerReconcileJumpSectionProps) {
  const { t } = useTranslation();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = reconcileId.trim();
    if (!id) return;
    onOpenReport(id);
  };

  return (
    <section
      id="admin-indexer-reconcile"
      className={`mt-8 ${ADMIN_FILTER_CARD_CLASS} shadow-soft scroll-mt-24`}
      aria-label={t("admin_indexer_reconcile_sectionTitle")}
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">{t("admin_indexer_reconcile_sectionTitle")}</h2>
      <p className="mt-1 text-body text-ink-600">{t("admin_indexer_reconcile_sectionHint")}</p>
      <p className="mt-2">
        <Link
          href="/admin/indexer/reconcile-reports"
          className={`${touchTargetLink44Classes} ${adminPageNavLinkClass()}`}
        >
          {t("admin_indexer_reconcile_list_link")}
        </Link>
      </p>
      <p id={indexerReconcileOpenFilterHintId} className="mt-3 text-meta text-ink-600 leading-relaxed">
        {t("admin_indexer_reconcile_open_filter_hint")}
      </p>
      <form aria-describedby={indexerReconcileOpenFilterHintId} className="mt-4 flex flex-wrap items-end gap-3" onSubmit={submit}>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-small text-ink-700">
          {t("admin_indexer_reconcile_idField")}
          <input
            type="text"
            name="report_id"
            value={reconcileId}
            onChange={(e) => setReconcileId(e.target.value)}
            className={`min-h-[44px] w-full rounded-[var(--radius-md)] border border-ink-200 bg-white px-3 py-2 font-mono text-body text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS} focus-visible:ring-offset-white`}
            placeholder={t("admin_indexer_reconcile_placeholder")}
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} focus-visible:ring-offset-white`}
          disabled={!reconcileId.trim()}
        >
          {t("admin_indexer_reconcile_open")}
        </button>
      </form>
    </section>
  );
}
