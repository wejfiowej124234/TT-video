import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getAuthHeaders } from "@/lib/apiClient";
import { buildGovernanceInvestorDistributionAccrualsUrl } from "@/lib/governanceInvestorDistributionAccruals";
import { mapApiReadError } from "@/lib/mapApiReadError";

import {
  type AccrualsListRes,
  type DistributionSummary,
  GOVERNANCE_DISTRIBUTION_ACCRUALS_LIST_LIMIT,
  asDistributionSummary,
} from "./governanceDistributionAccrualsPageModel";

export function useGovernanceDistributionAccrualsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<DistributionSummary[]>([]);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const path = buildGovernanceInvestorDistributionAccrualsUrl({ limit: GOVERNANCE_DISTRIBUTION_ACCRUALS_LIST_LIMIT });
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
        { headers, cache: "no-store" },
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

  return { rows, dataSource, note, loading, error, load, sourceLabel };
}
