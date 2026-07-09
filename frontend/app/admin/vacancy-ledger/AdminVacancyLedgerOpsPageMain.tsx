"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { adminTableRowPrimaryActionClass } from "@/components/admin/ops/OfficialOpsFilterBar";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { ADMIN_TABLE_TD_CELL_CLASS } from "@/lib/adminUi";
import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import { requestId, writeRequestHeaders } from "@/lib/apiClient/core";
import { formatVacancyUsdcAtomic } from "@/lib/governance/vacancyLedgerTransparencyModel";

type VacancyOpsResponse = {
  status?: string;
  protocolVersion?: string;
  protocolStatus?: string;
  runtimeStatus?: string;
  runtimeCapability?: string;
  runtimeActivation?: string;
  reconcileStatus?: string;
  network?: string;
  lastVerified?: string;
  readOnly?: boolean;
  reconciliation?: {
    reconcileStatus?: string;
    drift?: boolean;
    lastCheckedBlock?: number;
    projectionBlock?: number;
    mode?: string;
  };
  indexerHealth?: {
    lastIndexedBlock?: number;
    lastIndexedLogIndex?: number;
    lastEventTimestamp?: string;
    vacancyEventCount?: number;
    indexerCheckpointBlock?: number;
    lagBlocks?: number;
  };
  jurisdictions?: Array<{
    jurisdiction: string;
    runtimeStatus?: string;
    indexed?: boolean;
    ledger?: {
      state?: string;
      principal?: string;
      reserve?: string;
    } | null;
  }>;
  events?: Array<{
    occurredAt?: string;
    event?: string;
    jurisdiction?: string;
    blockNumber?: number;
    txHash?: string;
    ledgerFields?: {
      principal?: string;
      reserve?: string;
      swept?: string;
      disbursed?: string;
    };
  }>;
  note?: string;
};

function adminHeaders() {
  return { ...writeRequestHeaders(), "x-request-id": requestId() };
}

export function AdminVacancyLedgerOpsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VacancyOpsResponse | null>(null);
  const [jurisdiction, setJurisdiction] = useState<string>("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = jurisdiction.trim() ? `?jurisdiction=${encodeURIComponent(jurisdiction.trim().toUpperCase())}` : "";
      const res = await fetch(apiUrl(`${routes.adminVacancyLedgerOps}${q}`), {
        headers: adminHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as VacancyOpsResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch_failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [jurisdiction]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const events = useMemo(() => data?.events ?? [], [data]);

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_vacancy_ledger_ops_title")}
      subtitle={t("admin_vacancy_ledger_ops_subtitle")}
    >
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />

      <p className="mb-4 text-body-s text-ink-600" role="note">
        {t("admin_vacancy_ledger_ops_readonly_note")}
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-body-s text-ink-700">
          {t("admin_vacancy_ledger_ops_filter_jurisdiction")}
          <input
            type="text"
            maxLength={2}
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value.toUpperCase())}
            className="ml-2 rounded border border-ink-200 px-2 py-1 font-mono uppercase"
            data-tt-admin-vacancy-ops-jurisdiction-filter="1"
          />
        </label>
        <button
          type="button"
          className={adminTableRowPrimaryActionClass()}
          disabled={loading}
          onClick={() => void reload()}
          data-tt-admin-vacancy-ops-reload="1"
        >
          {t("admin_vacancy_ledger_ops_reload")}
        </button>
        <Link
          href="/governance/vacancy-ledger"
          className="text-body-s text-travel-600 hover:underline"
          data-tt-admin-vacancy-ops-governance-link="1"
        >
          {t("admin_vacancy_ledger_ops_governance_link")}
        </Link>
      </div>

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        loadingMessageKey="ops_plane_loading"
        empty={!loading && !error && !data}
        emptyMessageKey="admin_vacancy_ledger_ops_empty"
      >
        {data && (
          <>
            <AdminWarmL5Surface className="mb-6 p-4" data-tt-admin-vacancy-ops-runtime="1">
              <h2 className="text-body-m font-medium">{t("admin_vacancy_ledger_ops_runtime_heading")}</h2>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-body-s">
                <div>
                  <dt className="text-ink-500">{t("admin_vacancy_ledger_ops_protocol")}</dt>
                  <dd>{data.protocolVersion} · {data.protocolStatus}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">{t("admin_vacancy_ledger_ops_runtime")}</dt>
                  <dd>{data.runtimeCapability} · {data.runtimeActivation ?? data.runtimeStatus}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">{t("admin_vacancy_ledger_ops_network")}</dt>
                  <dd>{data.network}</dd>
                </div>
              </dl>
              {data.runtimeStatus === "PENDING" && (
                <p className="mt-3 text-body-s text-warning-800">{t("admin_vacancy_ledger_ops_runtime_pending")}</p>
              )}
            </AdminWarmL5Surface>

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <AdminWarmL5Surface className="p-4" data-tt-admin-vacancy-ops-reconcile="1">
                <h2 className="text-body-m font-medium">{t("admin_vacancy_ledger_ops_reconcile_heading")}</h2>
                <dl className="mt-3 space-y-1 text-body-s">
                  <div className="flex justify-between gap-4">
                    <dt>{t("admin_vacancy_ledger_ops_reconcile_status")}</dt>
                    <dd className="font-mono">{data.reconciliation?.reconcileStatus ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>{t("admin_vacancy_ledger_ops_drift")}</dt>
                    <dd>{data.reconciliation?.drift ? t("admin_vacancy_ledger_ops_yes") : t("admin_vacancy_ledger_ops_no")}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>{t("admin_vacancy_ledger_ops_last_checked_block")}</dt>
                    <dd className="font-mono">{data.reconciliation?.lastCheckedBlock ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>{t("admin_vacancy_ledger_ops_projection_block")}</dt>
                    <dd className="font-mono">{data.reconciliation?.projectionBlock ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>{t("admin_vacancy_ledger_ops_mode")}</dt>
                    <dd className="font-mono">{data.reconciliation?.mode ?? "—"}</dd>
                  </div>
                </dl>
              </AdminWarmL5Surface>

              <AdminWarmL5Surface className="p-4" data-tt-admin-vacancy-ops-indexer="1">
                <h2 className="text-body-m font-medium">{t("admin_vacancy_ledger_ops_indexer_heading")}</h2>
                <dl className="mt-3 space-y-1 text-body-s">
                  <div className="flex justify-between gap-4">
                    <dt>{t("admin_vacancy_ledger_ops_last_indexed_block")}</dt>
                    <dd className="font-mono">{data.indexerHealth?.lastIndexedBlock ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>{t("admin_vacancy_ledger_ops_last_event_ts")}</dt>
                    <dd className="font-mono text-meta">{data.indexerHealth?.lastEventTimestamp ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>{t("admin_vacancy_ledger_ops_lag_blocks")}</dt>
                    <dd className="font-mono">{data.indexerHealth?.lagBlocks ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>{t("admin_vacancy_ledger_ops_event_count")}</dt>
                    <dd className="font-mono">{data.indexerHealth?.vacancyEventCount ?? 0}</dd>
                  </div>
                </dl>
              </AdminWarmL5Surface>
            </div>

            <section className="mb-6" aria-label={t("admin_vacancy_ledger_ops_jurisdictions_aria")}>
              <h2 className="text-body-m font-medium">{t("admin_vacancy_ledger_ops_jurisdictions_heading")}</h2>
              <OfficialOpsDataTable className="mt-3">
                <OfficialOpsTableHead>
                  <tr>
                    <OfficialOpsTableTh>{t("admin_vacancy_ledger_ops_col_jurisdiction")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_vacancy_ledger_ops_col_state")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_vacancy_ledger_ops_col_runtime")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_vacancy_ledger_ops_col_indexed")}</OfficialOpsTableTh>
                  </tr>
                </OfficialOpsTableHead>
                <OfficialOpsTableBody>
                  {(data.jurisdictions ?? []).map((row) => (
                    <tr key={row.jurisdiction}>
                      <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.jurisdiction}</td>
                      <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.ledger?.state ?? "—"}</td>
                      <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.runtimeStatus ?? "—"}</td>
                      <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                        {row.indexed ? t("admin_vacancy_ledger_ops_yes") : t("admin_vacancy_ledger_ops_no")}
                      </td>
                    </tr>
                  ))}
                </OfficialOpsTableBody>
              </OfficialOpsDataTable>
            </section>

            <section aria-label={t("admin_vacancy_ledger_ops_events_aria")}>
              <h2 className="text-body-m font-medium">{t("admin_vacancy_ledger_ops_events_heading")}</h2>
              <OfficialOpsDataTable className="mt-3">
                <OfficialOpsTableHead>
                  <tr>
                    <OfficialOpsTableTh>{t("admin_vacancy_ledger_ops_col_when")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_vacancy_ledger_ops_col_event")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_vacancy_ledger_ops_col_jurisdiction")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_vacancy_ledger_ops_col_amount")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_vacancy_ledger_ops_col_tx")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_vacancy_ledger_ops_col_block")}</OfficialOpsTableTh>
                  </tr>
                </OfficialOpsTableHead>
                <OfficialOpsTableBody>
                  {events.map((ev) => {
                    const lf = ev.ledgerFields ?? {};
                    const amountLabel = lf.principal
                      ? `${formatVacancyUsdcAtomic(lf.principal)} USDC`
                      : lf.reserve
                        ? `reserve ${formatVacancyUsdcAtomic(lf.reserve)}`
                        : "—";
                    return (
                      <tr key={`${ev.blockNumber}:${ev.event}:${ev.occurredAt}`}>
                        <td className={`${ADMIN_TABLE_TD_CELL_CLASS} whitespace-nowrap text-meta`}>
                          {ev.occurredAt?.slice(0, 10) ?? "—"}
                        </td>
                        <td className={ADMIN_TABLE_TD_CELL_CLASS}>{ev.event}</td>
                        <td className={ADMIN_TABLE_TD_CELL_CLASS}>{ev.jurisdiction}</td>
                        <td className={ADMIN_TABLE_TD_CELL_CLASS}>{amountLabel}</td>
                        <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono text-meta max-w-[8rem] truncate`} title={ev.txHash}>
                          {ev.txHash ?? "—"}
                        </td>
                        <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono`}>{ev.blockNumber ?? "—"}</td>
                      </tr>
                    );
                  })}
                </OfficialOpsTableBody>
              </OfficialOpsDataTable>
              {events.length === 0 && (
                <p className="mt-2 text-body-s text-ink-500">{t("admin_vacancy_ledger_ops_events_empty")}</p>
              )}
            </section>

            {data.note && (
              <p className="mt-4 text-meta text-ink-600" role="note">
                {data.note}
              </p>
            )}
          </>
        )}
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
