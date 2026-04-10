"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getAuthHeaders } from "@/lib/apiClient";
import {
  buildGovernanceInvestorDistributionAccrualsUrl,
  isDistributionDetailUuid,
} from "@/lib/governanceInvestorDistributionAccruals";
import { shortHexAddr } from "@/lib/feeRouterWiring";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type AccrualLine = {
  holder_address: string;
  balance_snapshot_u256_hex: string;
  accrual_u256_hex: string;
};

type DistributionDetail = {
  id: string;
  chain_id: number;
  token_address: string;
  snapshot_block_number: number;
  total_cash_u256_hex: string;
  created_at: string;
  lines?: unknown[];
  snapshot_binding?: unknown;
};

type AccrualsDetailRes = {
  status: string;
  data_source?: string;
  items?: unknown[];
};

function asLine(row: unknown): AccrualLine | null {
  if (row == null || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const holder_address = typeof o.holder_address === "string" ? o.holder_address : null;
  const balance_snapshot_u256_hex =
    typeof o.balance_snapshot_u256_hex === "string" ? o.balance_snapshot_u256_hex : null;
  const accrual_u256_hex = typeof o.accrual_u256_hex === "string" ? o.accrual_u256_hex : null;
  if (!holder_address || !balance_snapshot_u256_hex || !accrual_u256_hex) return null;
  return { holder_address, balance_snapshot_u256_hex, accrual_u256_hex };
}

function asDetail(row: unknown): DistributionDetail | null {
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
    lines: o.lines as unknown[] | undefined,
    snapshot_binding: o.snapshot_binding,
  };
}

export default function GovernanceDistributionAccrualDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const pageTitleId = useId();

  const [detail, setDetail] = useState<DistributionDetail | null>(null);
  const [lines, setLines] = useState<AccrualLine[]>([]);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validUuid = isDistributionDetailUuid(rawId);

  const load = useCallback(async () => {
    if (!validUuid) {
      setDetail(null);
      setLines([]);
      setDataSource(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const path = buildGovernanceInvestorDistributionAccrualsUrl({ distributionId: rawId });
    const headers: Record<string, string> = { "x-request-id": `distribution-accrual-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      /* optional */
    }
    try {
      const { res, body } = await fetchJsonWithApiStatusLog<AccrualsDetailRes>(
        "governance-distribution-accruals-detail",
        apiUrl(path),
        { headers, cache: "no-store" }
      );
      if (!res.ok) {
        setDetail(null);
        setLines([]);
        setDataSource(null);
        setError(mapApiReadError(new Error(`request_failed_${res.status}`), t, "governance_requestFailed"));
        return;
      }
      const first = Array.isArray(body.items) && body.items.length > 0 ? asDetail(body.items[0]) : null;
      if (!first) {
        setDetail(null);
        setLines([]);
        setDataSource(typeof body.data_source === "string" ? body.data_source : null);
        setError(t("governance_distribution_accruals_not_found"));
        return;
      }
      const rawLines = Array.isArray(first.lines) ? first.lines : [];
      const parsed = rawLines.map(asLine).filter((x): x is AccrualLine => x != null);
      setDetail(first);
      setLines(parsed);
      setDataSource(typeof body.data_source === "string" ? body.data_source : null);
    } catch (e) {
      setDetail(null);
      setLines([]);
      setDataSource(null);
      setError(e instanceof Error ? e.message : t("itin_error_requestFailed"));
    } finally {
      setLoading(false);
    }
  }, [rawId, t, validUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  const sourceLabel =
    dataSource === "database"
      ? t("governance_distribution_accruals_source_database")
      : dataSource === "placeholder"
        ? t("governance_distribution_accruals_source_placeholder")
        : dataSource ?? "—";

  const bindingJson =
    detail?.snapshot_binding != null
      ? JSON.stringify(detail.snapshot_binding, null, 2)
      : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-ink-800">
      <GovernanceTargetNotice className="mb-6" />
      <p className="text-meta text-ink-600">
        <Link
          href="/governance/distribution-accruals"
          className={`text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_distribution_accruals_back_list")}
        </Link>
      </p>
      <h1 id={pageTitleId} className="mt-4 text-h3 font-semibold text-ink-900">
        {t("governance_distribution_accruals_detail_title")}
      </h1>
      <p className="mt-2 max-w-3xl text-body text-ink-700">{t("governance_distribution_accruals_desc")}</p>
      <p className="mt-2 font-mono text-meta text-ink-700 break-all">{rawId || "—"}</p>
      <p className="mt-1 text-meta text-ink-600">{sourceLabel}</p>

      {!validUuid ? (
        <p className="mt-6 text-body text-ink-700">{t("governance_distribution_accruals_invalid_id")}</p>
      ) : null}

      {validUuid && error ? (
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

      {validUuid && loading ? (
        <p className="mt-6 text-meta text-ink-500">{t("common_loading")}</p>
      ) : null}

      {validUuid && !loading && !error && detail ? (
        <>
          <dl className="mt-6 grid gap-2 text-small sm:grid-cols-2">
            <div>
              <dt className="text-meta text-ink-500">{t("governance_distribution_accruals_col_chain")}</dt>
              <dd>{detail.chain_id}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("governance_distribution_accruals_col_snapshot")}</dt>
              <dd>{detail.snapshot_block_number}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-meta text-ink-500">{t("governance_distribution_accruals_col_token")}</dt>
              <dd className="break-all font-mono">{detail.token_address}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-meta text-ink-500">{t("governance_distribution_accruals_col_total_cash")}</dt>
              <dd className="break-all font-mono">{detail.total_cash_u256_hex}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-meta text-ink-500">{t("governance_distribution_accruals_col_created")}</dt>
              <dd>{detail.created_at}</dd>
            </div>
          </dl>

          <h2 className="mt-8 text-h4 font-medium text-ink-900">{t("governance_distribution_accruals_lines_title")}</h2>
          {lines.length === 0 ? (
            <p className="mt-2 text-body text-ink-600">{t("governance_distribution_accruals_empty")}</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200">
              <table className="min-w-full border-collapse text-left text-small">
                <thead className="bg-ink-50">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_holder")}</th>
                    <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_balance_snap")}</th>
                    <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_accrual")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {lines.map((line) => (
                    <tr key={`${line.holder_address}-${line.accrual_u256_hex}`}>
                      <td className="px-3 py-2 font-mono" title={line.holder_address}>
                        {shortHexAddr(line.holder_address)}
                      </td>
                      <td className="px-3 py-2 font-mono" title={line.balance_snapshot_u256_hex}>
                        {shortHexAddr(line.balance_snapshot_u256_hex, 6, 4)}
                      </td>
                      <td className="px-3 py-2 font-mono" title={line.accrual_u256_hex}>
                        {shortHexAddr(line.accrual_u256_hex, 6, 4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {bindingJson ? (
            <section className="mt-8">
              <h2 className="text-h4 font-medium text-ink-900">{t("governance_distribution_accruals_snapshot_binding")}</h2>
              <pre className="mt-2 max-h-96 overflow-auto rounded-[var(--radius-md)] border border-ink-200 bg-ink-50 p-3 text-meta font-mono whitespace-pre-wrap break-all">
                {bindingJson}
              </pre>
            </section>
          ) : null}
        </>
      ) : null}

      <nav className="mt-10 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance/distribution-accruals"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_distribution_accruals_title")}
        </Link>
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
        <GovernanceOpsAdminLinks />
        <Link href="/help" className={`text-travel-500 hover:underline ${travelFocusRingOffset2Classes} inline-flex min-h-[44px] items-center`}>
          {t("help_title")}
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
