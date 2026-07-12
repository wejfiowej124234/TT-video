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
  formatNetProfitUsdcAtomic,
  lifecycleStageReached,
  NET_PROFIT_LIFECYCLE_STAGES,
  type GovernanceNetProfitLedgerResponse,
  type NetProfitJurisdictionRow,
} from "@/lib/governance/netProfitLedgerTransparencyModel";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export default function GovernanceNetProfitLedgerPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const [data, setData] = useState<GovernanceNetProfitLedgerResponse | null>(null);
  const [detailJurisdiction, setDetailJurisdiction] = useState<string | null>("DE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(
    async (jurisdiction: string | null) => {
      const q = jurisdiction
        ? `?jurisdiction=${encodeURIComponent(jurisdiction)}&timeline_limit=100&epochs_limit=20`
        : "";
      const { res, body } = await fetchJsonWithApiStatusLog<GovernanceNetProfitLedgerResponse>(
        "governanceNetProfitLedger",
        apiUrl(`${routes.governanceNetProfitLedger}${q}`),
      );
      if (!res.ok) throw new Error(t("governance_requestFailed"));
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

  const selectedRow: NetProfitJurisdictionRow | null = useMemo(() => {
    if (!data || !detailJurisdiction) return null;
    return data.jurisdictions?.find((j) => j.jurisdiction === detailJurisdiction) ?? null;
  }, [data, detailJurisdiction]);

  const navLink = `inline-flex min-h-[44px] items-center text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`;

  return (
    <main className="mx-auto max-w-5xl p-8" aria-labelledby={pageTitleId}>
      <p className="text-meta font-medium uppercase tracking-wide text-ink-500">
        {t("governance_net_profit_ledger_kicker")}
      </p>
      <h1 id={pageTitleId} className="mt-1 text-h3 font-semibold text-ink-900">
        {t("governance_net_profit_ledger_title")}
      </h1>
      <p className="mt-2 max-w-3xl text-body text-ink-600">{t("governance_net_profit_ledger_desc")}</p>
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
          <section className="mt-6 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50/70 p-4">
            <h2 className="text-body font-semibold text-ink-900">
              {t("governance_net_profit_ledger_runtime_heading")}
            </h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-meta text-ink-500">{t("governance_net_profit_ledger_protocol_version")}</dt>
                <dd className="font-medium text-ink-900">{data.protocolVersion}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_net_profit_ledger_split_ratio")}</dt>
                <dd className="font-medium text-ink-900">{data.splitRatio}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_net_profit_ledger_data_source")}</dt>
                <dd className="font-mono text-small text-ink-800">{data.dataSource}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_net_profit_ledger_accounting_audit")}</dt>
                <dd className="font-mono text-small text-ink-800">{data.accountingAudit?.status ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-8">
            <h2 className="text-body font-semibold text-ink-900">
              {t("governance_net_profit_ledger_jurisdictions_heading")}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(data.jurisdictions ?? []).map((j) => (
                <button
                  key={j.jurisdiction}
                  type="button"
                  className={`rounded-[var(--radius-sm)] border px-3 py-2 text-small ${
                    detailJurisdiction === j.jurisdiction
                      ? "border-travel-500 bg-travel-50 text-travel-700"
                      : "border-ink-200 bg-white text-ink-700"
                  }`}
                  onClick={() => setDetailJurisdiction(j.jurisdiction)}
                >
                  {j.jurisdiction}
                  {j.indexed ? "" : " ·"}
                </button>
              ))}
            </div>
          </section>

          {selectedRow && (
            <>
              <section className="mt-8">
                <h2 className="text-body font-semibold text-ink-900">
                  {t("governance_net_profit_ledger_epochs_heading")} · {selectedRow.jurisdiction}
                </h2>
                <div className="mt-3 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200">
                  <table className="min-w-full border-collapse text-left text-small">
                    <thead className="bg-ink-50 text-meta font-medium uppercase tracking-wide text-ink-600">
                      <tr>
                        <th className="px-3 py-2">{t("governance_net_profit_ledger_col_epoch")}</th>
                        <th className="px-3 py-2">{t("governance_net_profit_ledger_col_status")}</th>
                        <th className="px-3 py-2">{t("governance_net_profit_ledger_col_net_profit_prime")}</th>
                        <th className="px-3 py-2">45%</th>
                        <th className="px-3 py-2">55%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedRow.epochs ?? []).map((ep) => (
                        <tr key={ep.epochId} className="border-t border-ink-100">
                          <td className="px-3 py-2 font-mono">{ep.epochId}</td>
                          <td className="px-3 py-2">{ep.status}</td>
                          <td className="px-3 py-2 font-mono">
                            {formatNetProfitUsdcAtomic(ep.netProfitPrime)} USDC
                          </td>
                          <td className="px-3 py-2 font-mono">
                            {formatNetProfitUsdcAtomic(ep.stewardAmount ?? ep.unallocatedAmount)} USDC
                          </td>
                          <td className="px-3 py-2 font-mono">
                            {formatNetProfitUsdcAtomic(ep.globalAmount)} USDC
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mt-8">
                <h2 className="text-body font-semibold text-ink-900">
                  {t("governance_net_profit_ledger_timeline_heading")}
                </h2>
                <ul className="mt-3 space-y-2">
                  {NET_PROFIT_LIFECYCLE_STAGES.map((stage) => (
                    <li key={stage} className="flex items-center gap-2 text-small">
                      <span
                        className={
                          lifecycleStageReached(selectedRow.timeline, stage)
                            ? "text-success-700"
                            : "text-ink-400"
                        }
                      >
                        {lifecycleStageReached(selectedRow.timeline, stage) ? "✓" : "○"}
                      </span>
                      <span className="font-mono">{stage}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200">
                  <table className="min-w-full border-collapse text-left text-small">
                    <thead className="bg-ink-50 text-meta font-medium uppercase tracking-wide text-ink-600">
                      <tr>
                        <th className="px-3 py-2">{t("governance_net_profit_ledger_col_event")}</th>
                        <th className="px-3 py-2">{t("governance_net_profit_ledger_col_block")}</th>
                        <th className="px-3 py-2">{t("governance_net_profit_ledger_col_tx")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedRow.timeline ?? []).map((ev, i) => (
                        <tr key={`${ev.blockNumber}-${ev.logIndex}-${i}`} className="border-t border-ink-100">
                          <td className="px-3 py-2 font-mono">{ev.event}</td>
                          <td className="px-3 py-2 font-mono">{ev.blockNumber}</td>
                          <td className="px-3 py-2 font-mono truncate max-w-[12rem]">{ev.txHash ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}

      <nav className="mt-10 flex flex-wrap gap-4">
        <Link href="/governance" className={navLink}>
          {t("governance_hub_title")}
        </Link>
        <Link href="/governance/vacancy-ledger" className={navLink}>
          {t("governance_vacancy_ledger_title")}
        </Link>
        <ProductCrossNav ariaLabelKey="governance_subpage_relatedNav_aria" className="flex flex-wrap gap-3" />
      </nav>
    </main>
  );
}
