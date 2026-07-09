"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  formatVacancyUsdcAtomic,
  lifecycleStageReached,
  VACANCY_LIFECYCLE_STAGES,
  type GovernanceVacancyLedgerResponse,
  type VacancyJurisdictionRow,
} from "@/lib/governance/vacancyLedgerTransparencyModel";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export default function GovernanceVacancyLedgerPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const [data, setData] = useState<GovernanceVacancyLedgerResponse | null>(null);
  const [detailJurisdiction, setDetailJurisdiction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(
    async (jurisdiction: string | null) => {
      const q = jurisdiction
        ? `?jurisdiction=${encodeURIComponent(jurisdiction)}&timeline_limit=100`
        : "";
      const { res, body } = await fetchJsonWithApiStatusLog<GovernanceVacancyLedgerResponse>(
        "governanceVacancyLedger",
        apiUrl(`${routes.governanceVacancyLedger}${q}`),
      );
      if (!res.ok) {
        throw new Error(t("governance_requestFailed"));
      }
      return body;
    },
    [t],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchLedger(detailJurisdiction)
      .then(setData)
      .catch((e) => {
        setError(mapApiReadError(e, t, "governance_requestFailed"));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [detailJurisdiction, fetchLedger, t]);

  const selectedRow: VacancyJurisdictionRow | null = useMemo(() => {
    if (!data || !detailJurisdiction) return null;
    return data.jurisdictions.find((j) => j.jurisdiction === detailJurisdiction) ?? null;
  }, [data, detailJurisdiction]);

  const navLink = `inline-flex min-h-[44px] items-center text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`;

  return (
    <main className="mx-auto max-w-5xl p-8" aria-labelledby={pageTitleId}>
      <p className="text-meta font-medium uppercase tracking-wide text-ink-500">
        {t("governance_vacancy_ledger_kicker")}
      </p>
      <h1 id={pageTitleId} className="mt-1 text-h3 font-semibold text-ink-900">
        {t("governance_vacancy_ledger_title")}
      </h1>
      <p className="mt-2 max-w-3xl text-body text-ink-600">{t("governance_vacancy_ledger_desc")}</p>
      <GovernanceTargetNotice className="mt-3 max-w-3xl" />

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("common_loading")}
        </p>
      )}
      {error && (
        <div className="mt-6">
          <ApiErrorAlert message={error} />
        </div>
      )}

      {!loading && data && (
        <>
          <section
            className="mt-6 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50/70 p-4"
            aria-label={t("governance_vacancy_ledger_runtime_panel_aria")}
          >
            <h2 className="text-body font-semibold text-ink-900">
              {t("governance_vacancy_ledger_runtime_heading")}
            </h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-meta text-ink-500">{t("governance_vacancy_ledger_protocol_version")}</dt>
                <dd className="font-medium text-ink-900">{data.protocolVersion}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_vacancy_ledger_protocol_status")}</dt>
                <dd className="font-medium text-ink-900">{data.protocolStatus}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_vacancy_ledger_runtime_status")}</dt>
                <dd className="font-medium text-warning-700">{data.runtimeStatus}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_vacancy_ledger_runtime_capability")}</dt>
                <dd className="font-mono text-small text-ink-800">{data.runtimeCapability}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_vacancy_ledger_network")}</dt>
                <dd className="text-ink-900">
                  {data.network} ({data.chainId})
                </dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_vacancy_ledger_last_verified")}</dt>
                <dd className="text-ink-900">{data.lastVerified}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_vacancy_ledger_reconcile_status")}</dt>
                <dd className="font-mono text-small text-ink-800">{data.reconcileStatus}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_vacancy_ledger_data_source")}</dt>
                <dd className="font-mono text-small text-ink-800">{data.dataSource}</dd>
              </div>
            </dl>
            {data.runtimeStatus === "PENDING" && (
              <p className="mt-3 rounded-[var(--radius-sm)] border border-warning/30 bg-warning/10 px-3 py-2 text-small text-ink-800">
                {t("governance_vacancy_ledger_runtime_pending_notice")}
              </p>
            )}
            {data.note && (
              <p className="mt-2 text-meta text-ink-600" role="note">
                {data.note}
              </p>
            )}
          </section>

          <section className="mt-8" aria-label={t("governance_vacancy_ledger_jurisdictions_aria")}>
            <h2 className="text-body font-semibold text-ink-900">
              {t("governance_vacancy_ledger_jurisdictions_heading")}
            </h2>
            <div className="mt-3 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200">
              <table className="min-w-full border-collapse text-left text-small">
                <thead className="bg-ink-50 text-meta font-medium uppercase tracking-wide text-ink-600">
                  <tr>
                    <th className="px-3 py-2">{t("governance_vacancy_ledger_col_jurisdiction")}</th>
                    <th className="px-3 py-2">{t("governance_vacancy_ledger_col_state")}</th>
                    <th className="px-3 py-2">{t("governance_vacancy_ledger_col_runtime")}</th>
                    <th className="px-3 py-2">{t("governance_vacancy_ledger_col_indexed")}</th>
                    <th className="px-3 py-2">{t("governance_vacancy_ledger_col_view")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 text-ink-800">
                  {data.jurisdictions.map((row) => (
                    <tr key={row.jurisdiction} className="hover:bg-ink-50">
                      <td className="px-3 py-2 font-medium">{row.jurisdiction}</td>
                      <td className="px-3 py-2">{row.ledger?.state ?? "—"}</td>
                      <td className="px-3 py-2">{row.runtimeStatus}</td>
                      <td className="px-3 py-2">
                        {row.indexed ? t("governance_vacancy_ledger_indexed_yes") : t("governance_vacancy_ledger_indexed_no")}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className={`text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                          onClick={() => setDetailJurisdiction(row.jurisdiction)}
                        >
                          {t("governance_vacancy_ledger_view_detail")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {selectedRow && (
            <section className="mt-8 space-y-6" aria-label={t("governance_vacancy_ledger_detail_aria")}>
              <h2 className="text-body font-semibold text-ink-900">
                {t("governance_vacancy_ledger_detail_heading").replace("{{j}}", selectedRow.jurisdiction)}
              </h2>

              {selectedRow.ledger ? (
                <div className="rounded-[var(--radius-md)] border border-ink-200 p-4">
                  <h3 className="text-body font-semibold text-ink-900">
                    {t("governance_vacancy_ledger_ledger_heading")}
                  </h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ["governance_vacancy_ledger_field_principal", selectedRow.ledger.principal],
                        ["governance_vacancy_ledger_field_swept", selectedRow.ledger.swept],
                        ["governance_vacancy_ledger_field_reserve", selectedRow.ledger.reserve],
                        ["governance_vacancy_ledger_field_disbursed", selectedRow.ledger.disbursed],
                      ] as const
                    ).map(([labelKey, atomic]) => (
                      <div key={labelKey}>
                        <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                        <dd className="text-ink-900">
                          {formatVacancyUsdcAtomic(atomic)} USDC
                        </dd>
                      </div>
                    ))}
                    <div>
                      <dt className="text-meta text-ink-500">{t("governance_vacancy_ledger_field_state")}</dt>
                      <dd className="text-ink-900">{selectedRow.ledger.state}</dd>
                    </div>
                    <div>
                      <dt className="text-meta text-ink-500">{t("governance_vacancy_ledger_field_sweep_enabled")}</dt>
                      <dd className="text-ink-900">
                        {selectedRow.ledger.sweepEnabled
                          ? t("governance_vacancy_ledger_yes")
                          : t("governance_vacancy_ledger_no")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-meta text-ink-500">{t("governance_vacancy_ledger_field_activation_epoch")}</dt>
                      <dd className="text-ink-900">
                        {selectedRow.ledger.stewardActivationEpochId ?? "—"}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-meta text-ink-500">{t("governance_vacancy_ledger_indexer_only_note")}</p>
                </div>
              ) : (
                <p className="text-body text-ink-600">{t("governance_vacancy_ledger_not_indexed")}</p>
              )}

              <div className="rounded-[var(--radius-md)] border border-ink-200 p-4">
                <h3 className="text-body font-semibold text-ink-900">
                  {t("governance_vacancy_ledger_timeline_heading")}
                </h3>
                <ol className="mt-4 space-y-2 border-l-2 border-ink-200 pl-4">
                  {VACANCY_LIFECYCLE_STAGES.map((stage) => {
                    const reached = lifecycleStageReached(
                      stage.id,
                      selectedRow.ledger?.state,
                      selectedRow.timeline,
                    );
                    return (
                      <li
                        key={stage.id}
                        className={`text-small ${reached ? "font-medium text-ink-900" : "text-ink-400"}`}
                      >
                        {t(stage.labelKey)}
                      </li>
                    );
                  })}
                </ol>
                {selectedRow.timeline && selectedRow.timeline.length > 0 && (
                  <ul className="mt-4 space-y-2 text-meta text-ink-700">
                    {selectedRow.timeline.map((ev) => (
                      <li key={`${ev.blockNumber}:${ev.logIndex}`}>
                        <span className="font-mono">{ev.event}</span>
                        {" · "}
                        block {ev.blockNumber}
                        {ev.txHash ? ` · ${ev.txHash.slice(0, 10)}…` : ""}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-meta text-ink-500">{t("governance_vacancy_ledger_timeline_note")}</p>
              </div>
            </section>
          )}
        </>
      )}

      <nav className="mt-10 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link href="/governance" className={navLink}>
          {t("governance_title")}
        </Link>
        <Link href="/governance/params" className={navLink}>
          {t("governance_params_title")}
        </Link>
        <Link href="/governance/fee-routes" className={navLink}>
          {t("governance_fee_routes_title")}
        </Link>
        <Link href="/help" className={navLink}>
          {t("help_title")}
        </Link>
      </nav>
      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
