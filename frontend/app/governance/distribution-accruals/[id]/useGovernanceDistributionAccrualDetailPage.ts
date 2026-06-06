import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getAuthHeaders } from "@/lib/apiClient";
import {
  buildGovernanceInvestorDistributionAccrualsUrl,
  isDistributionDetailUuid,
} from "@/lib/governanceInvestorDistributionAccruals";
import { mapApiReadError } from "@/lib/mapApiReadError";

import {
  type AccrualsDetailRes,
  type AccrualLine,
  type DistributionDetail,
  asDetail,
  asLine,
} from "./governanceDistributionAccrualDetailPageModel";

export function useGovernanceDistributionAccrualDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";

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
        { headers, cache: "no-store" },
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
    detail?.snapshot_binding != null ? JSON.stringify(detail.snapshot_binding, null, 2) : null;

  return { rawId, validUuid, detail, lines, loading, error, load, sourceLabel, bindingJson };
}
