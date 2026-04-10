"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  adminErrorUserText,
  adminFetchErrorKind,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import {
  getAdminCrossCheck,
  normalizeAdminCrossCheckRead,
  type NormalizedAdminCrossCheck,
  type NormalizedCrossCheckSlot,
} from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

function formatUnknownJson(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    const s = JSON.stringify(value, null, 2);
    return s ?? String(value);
  } catch {
    return String(value);
  }
}

const SLOT_DEFS = [
  {
    id: "fee_pool_projection" as const,
    titleKey: "admin_cross_check_slot_fee_pool_projection" as const,
    index: 1,
    pick: (n: NormalizedAdminCrossCheck) => n.fee_pool_projection,
  },
  {
    id: "governance_pool_chain" as const,
    titleKey: "admin_cross_check_slot_governance_pool_chain" as const,
    index: 2,
    pick: (n: NormalizedAdminCrossCheck) => n.governance_pool_chain,
  },
  {
    id: "protocol_reference" as const,
    titleKey: "admin_cross_check_slot_protocol_reference" as const,
    index: 3,
    pick: (n: NormalizedAdminCrossCheck) => n.protocol_reference,
  },
];

function SlotBlock({
  title,
  slotIndexLabel,
  slot,
  sourceKindLabel,
  bodyLabel,
  testId,
  missingSourceKindLabel,
  anchorId,
}: {
  title: string;
  slotIndexLabel: string;
  slot: NormalizedCrossCheckSlot | undefined;
  sourceKindLabel: string;
  bodyLabel: string;
  testId: string;
  missingSourceKindLabel: string;
  anchorId: string;
}) {
  const sk = slot?.source_kind;
  return (
    <section
      id={anchorId}
      data-testid={testId}
      aria-label={`${slotIndexLabel} · ${title}`}
      className="scroll-mt-[5rem] rounded-[var(--radius-xl)] border border-ink-200 bg-white/60 p-5 shadow-sm dark:bg-bg-console/80"
    >
      <header className="border-b border-ink-100 pb-3">
        <p className="text-meta font-medium uppercase tracking-wide text-ink-500">{slotIndexLabel}</p>
        <h3 className="mt-1 font-mono text-body font-semibold text-ink-900">{title}</h3>
      </header>
      <div className="pt-4">
        <p className="text-meta text-ink-600">
          <span className="font-mono text-ink-700">{sourceKindLabel}</span>
          {": "}
          <span className="font-mono text-ink-900">{sk ?? missingSourceKindLabel}</span>
        </p>
        <p className="mt-2 text-meta font-medium text-ink-600">{bodyLabel}</p>
        <pre className="mt-2 max-h-[min(24rem,50vh)] overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
          {formatUnknownJson(slot?.body)}
        </pre>
      </div>
    </section>
  );
}

/** Epic C-03 / C-05：三槽只读 JSON（C-02 归一化）；分区 + 页内导航；不解释业务字段、不做计算。 */
export default function AdminCrossCheckPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const slotsRegionTitleId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [model, setModel] = useState<NormalizedAdminCrossCheck | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAdminCrossCheck()
      .then((raw) => setModel(normalizeAdminCrossCheckRead(raw)))
      .catch((e: unknown) => {
        logAdminFetch("AdminCrossCheckPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-full flex-1">
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_cross_check_title")}
          </h1>
          <div
            className="mt-3 rounded-[var(--radius-lg)] border border-amber-200/80 bg-amber-50/90 p-4 text-body text-ink-800"
            role="note"
            data-testid="admin-audit-read-only-scope"
          >
            {t("admin_audit_tools_read_only_scope")}
          </div>
          <p className="mt-3 text-body text-ink-600">{t("admin_cross_check_subtitle")}</p>
        </div>
        <Link
          href="/admin"
          className={`${touchTargetLink44Classes} shrink-0 text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_schema_back")}
        </Link>
      </header>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-body text-ink-600">{t("admin_cross_check_loading")}</p>
        ) : error ? (
          <p className="text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : model ? (
          <div className="space-y-6">
            {model.status ? (
              <p className="font-mono text-meta text-ink-600">
                {t("admin_cross_check_status_label")}:{" "}
                <span className="text-ink-900">{model.status}</span>
              </p>
            ) : null}

            <section
              className="overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console shadow-sm"
              role="region"
              aria-labelledby={slotsRegionTitleId}
              data-testid="admin-cross-check-slots-region"
            >
              <div className="border-b border-ink-200 bg-ink-50/80 px-4 py-4 sm:px-5 dark:bg-ink-900/20">
                <h2 id={slotsRegionTitleId} className="text-h4 font-semibold text-ink-900">
                  {t("admin_cross_check_slots_region_heading")}
                </h2>
                <p className="mt-1 text-body text-ink-600">{t("admin_cross_check_slots_region_hint")}</p>
              </div>

              <nav
                className="border-b border-ink-200 bg-bg-console px-4 py-3 sm:px-5"
                aria-label={t("admin_cross_check_slots_jump_nav_aria")}
                data-testid="admin-cross-check-slots-jump-nav"
              >
                <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
                  {SLOT_DEFS.map((def) => (
                    <li key={def.id}>
                      <a
                        href={`#cross-check-slot-${def.id}`}
                        className={`${touchTargetLink44Classes} inline-flex font-mono text-small text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                      >
                        {t(def.titleKey)}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="space-y-6 p-4 sm:p-5">
                {SLOT_DEFS.map((def) => (
                  <SlotBlock
                    key={def.id}
                    anchorId={`cross-check-slot-${def.id}`}
                    title={t(def.titleKey)}
                    slotIndexLabel={t("admin_cross_check_slot_index").replace("{n}", String(def.index))}
                    slot={def.pick(model)}
                    sourceKindLabel={t("admin_cross_check_source_kind")}
                    bodyLabel={t("admin_cross_check_raw_body")}
                    testId={`admin-cross-check-slot-${def.id}`}
                    missingSourceKindLabel={t("admin_em_dash")}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
