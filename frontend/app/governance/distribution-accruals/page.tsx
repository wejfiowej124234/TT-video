"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getAuthHeaders } from "@/lib/apiClient";
import { buildGovernanceInvestorDistributionAccrualsUrl } from "@/lib/governanceInvestorDistributionAccruals";
import { shortHexAddr } from "@/lib/feeRouterWiring";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 04 §3.4 GET /api/v1/governance/investor-distribution-accruals（列表项无 lines） */
type DistributionSummary = {
  id: string;
  chain_id: number;
  token_address: string;
  snapshot_block_number: number;
  total_cash_u256_hex: string;
  created_at: string;
};

type AccrualsListRes = {
  status: string;
  data_source?: string;
  items?: unknown[];
  note?: string;
};

function asDistributionSummary(row: unknown): DistributionSummary | null {
  if (row == null || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : null;
  const chain_id = typeof o.chain_id === "number" ? o.chain_id : null;
  const token_address = typeof o.token_address === "string" ? o.token_address : null;
  const snapshot_block_number =
    typeof o.snapshot_block_number === "number" ? o.snapshot_block_number : null;
  const total_cash_u256_hex = typeof o.total_cash_u256_hex === "string" ? o.total_cash_u256_hex : null;
  const created_at = typeof o.created_at === "string" ? o.created_at : null;
  if (!id || chain_id == null || !token_address || snapshot_block_number == null || !total_cash_u256_hex || !created_at) {
    return null;
  }
  return {
    id,
    chain_id,
    token_address,
    snapshot_block_number,
    total_cash_u256_hex,
    created_at,
  };
}

const PAGE_LIMIT = 50;

export default function GovernanceDistributionAccrualsPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const [rows, setRows] = useState<DistributionSummary[]>([]);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const path = buildGovernanceInvestorDistributionAccrualsUrl({ limit: PAGE_LIMIT });
    const headers: Record<string, string> = { "x-request-id": `distribution-accruals-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      /* optional auth */
    }
    try {
      const { res, body } = await fetchJsonWithApiStatusLog<AccrualsListRes>(
        "governance-distribution-accruals-list",
        apiUrl(path),
        { headers, cache: "no-store" }
      );
      if (!res.ok) {
        setRows([]);
        setDataSource(null);
        setNote(null);
        setError(mapApiReadError(new Error(`request_failed_${res.status}`), t, "governance_requestFailed"));
        return;
      }
      const items = Array.isArray(body.items) ? body.items : [];
      const parsed = items.map(asDistributionSummary).filter((x): x is DistributionSummary => x != null);
      setRows(parsed);
      setDataSource(typeof body.data_source === "string" ? body.data_source : null);
      setNote(typeof body.note === "string" ? body.note : null);
    } catch (e) {
      setRows([]);
      setDataSource(null);
      setNote(null);
      setError(e instanceof Error ? e.message : t("itin_error_requestFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const sourceLabel =
    dataSource === "database"
      ? t("governance_distribution_accruals_source_database")
      : dataSource === "placeholder"
        ? t("governance_distribution_accruals_source_placeholder")
        : dataSource ?? "—";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-ink-800">
      <GovernanceTargetNotice className="mb-6" />
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_distribution_accruals_title")}
      </h1>
      <p className="mt-2 max-w-3xl text-body text-ink-700">{t("governance_distribution_accruals_desc")}</p>
      <p className="mt-2 text-meta text-ink-600">{sourceLabel}</p>
      {dataSource === "placeholder" && note ? (
        <p className="mt-1 text-meta text-ink-500">
          {note} — {t("governance_distribution_accruals_placeholder_note")}
        </p>
      ) : null}

      {error ? (
        <div className="mt-4">
          <ApiErrorAlert message={error} />
          <button
            type="button"
            className={`mt-3 inline-flex min-h-[44px] items-center rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingOffset2Classes}`}
            onClick={() => void load()}
          >
            {t("common_retry")}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-6 text-meta text-ink-500">{t("common_loading")}</p>
      ) : !error && rows.length === 0 ? (
        <p className="mt-6 text-body text-ink-600">{t("governance_distribution_accruals_empty")}</p>
      ) : !error ? (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200">
          <table className="min-w-full border-collapse text-left text-small">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_id")}</th>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_chain")}</th>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_token")}</th>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_snapshot")}</th>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_created")}</th>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_total_cash")}</th>
                <th className="px-3 py-2 font-medium" aria-label={t("governance_distribution_accruals_view_detail")}>
                  <span className="sr-only">{t("governance_distribution_accruals_view_detail")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 font-mono text-meta break-all max-w-[14rem]">{row.id}</td>
                  <td className="px-3 py-2">{row.chain_id}</td>
                  <td className="px-3 py-2 font-mono" title={row.token_address}>
                    {shortHexAddr(row.token_address)}
                  </td>
                  <td className="px-3 py-2">{row.snapshot_block_number}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.created_at}</td>
                  <td className="px-3 py-2 font-mono" title={row.total_cash_u256_hex}>
                    {shortHexAddr(row.total_cash_u256_hex, 6, 4)}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/governance/distribution-accruals/${row.id}`}
                      className={`text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
                    >
                      {t("governance_distribution_accruals_view_detail")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <nav className="mt-10 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_title")}
        </Link>
        <Link
          href="/governance/fee-routes"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_fee_routes_title")}
        </Link>
        <Link
          href="/governance/vault-forwards"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_vault_forwards_title")}
        </Link>
        <Link
          href="/governance/distribution-claim"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_claim_title")}
        </Link>
        <Link
          href="/governance/proposals"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_proposals_title")}
        </Link>
        <Link
          href="/governance/params"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_params_title")}
        </Link>
        <Link
          href="/traveltrust#fee-router"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("traveltrust_link_feeRouter")}
        </Link>
        <GovernanceOpsAdminLinks />
        <Link
          href="/help"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("help_title")}
        </Link>
        <Link
          href="/"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_backHome")}
        </Link>
      </nav>
      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
