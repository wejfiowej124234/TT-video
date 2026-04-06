"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type FeeLayer = { country_bucket: number; global_pool: number };
type GlobalSplit = { ttg_stakers: number; reserve: number; operations: number };
type CountryRow = {
  name_zh: string;
  tier: string;
  national_pool_cap_fee_points: number;
  phase1_open_fee_points: number;
  fundraise_target_cny_wan: number;
  fundraise_cap_cny_wan: number;
  notes?: string;
};
type ProtocolRef = {
  status: string;
  doc_ref?: string;
  doc_version?: string;
  note?: string;
  /** GET …/protocol-reference/pending 根级：mirror | env_overlay | overlay_parse_error */
  pending_package_source?: string;
  fee_router?: {
    layer1_percent_of_allocatable_platform_fee?: FeeLayer;
    global_pool_split_percent?: GlobalSplit;
    orthogonality_ref?: string;
  };
  phase1_countries?: CountryRow[];
  checksums?: Record<string, string | number>;
};

type FeeMetricRow = { id: string; labelKey: string; cur: number; pen: number };

function buildFeeMetricDiffRows(current: ProtocolRef, pending: ProtocolRef): FeeMetricRow[] | null {
  const cL1 = current.fee_router?.layer1_percent_of_allocatable_platform_fee;
  const pL1 = pending.fee_router?.layer1_percent_of_allocatable_platform_fee;
  const cG = current.fee_router?.global_pool_split_percent;
  const pG = pending.fee_router?.global_pool_split_percent;
  if (
    !cL1 ||
    !pL1 ||
    !cG ||
    !pG ||
    typeof cL1.country_bucket !== "number" ||
    typeof pL1.country_bucket !== "number" ||
    typeof cL1.global_pool !== "number" ||
    typeof pL1.global_pool !== "number" ||
    typeof cG.ttg_stakers !== "number" ||
    typeof pG.ttg_stakers !== "number" ||
    typeof cG.reserve !== "number" ||
    typeof pG.reserve !== "number" ||
    typeof cG.operations !== "number" ||
    typeof pG.operations !== "number"
  ) {
    return null;
  }
  return [
    {
      id: "l1_country",
      labelKey: "governance_params_layer1_country",
      cur: cL1.country_bucket,
      pen: pL1.country_bucket,
    },
    {
      id: "l1_global",
      labelKey: "governance_params_layer1_global",
      cur: cL1.global_pool,
      pen: pL1.global_pool,
    },
    {
      id: "gp_stakers",
      labelKey: "governance_params_stakers",
      cur: cG.ttg_stakers,
      pen: pG.ttg_stakers,
    },
    {
      id: "gp_reserve",
      labelKey: "governance_params_reserve",
      cur: cG.reserve,
      pen: pG.reserve,
    },
    {
      id: "gp_ops",
      labelKey: "governance_params_operations",
      cur: cG.operations,
      pen: pG.operations,
    },
  ];
}

/**
 * 与 `governance_doc_reference::protocol_reference_json()` 成功体对齐：须同时具备
 * layer1 拆分、Global Pool 拆分、非空 phase1_countries；避免 HTTP 200 但瘦响应被当成「已完整加载」。
 */
function protocolReferenceHasSubstance(d: ProtocolRef): boolean {
  const l1 = d.fee_router?.layer1_percent_of_allocatable_platform_fee;
  const gp = d.fee_router?.global_pool_split_percent;
  const hasLayer1 =
    l1 != null &&
    typeof l1.country_bucket === "number" &&
    Number.isFinite(l1.country_bucket) &&
    typeof l1.global_pool === "number" &&
    Number.isFinite(l1.global_pool);
  const hasGlobalSplit =
    gp != null &&
    typeof gp.ttg_stakers === "number" &&
    Number.isFinite(gp.ttg_stakers) &&
    typeof gp.reserve === "number" &&
    Number.isFinite(gp.reserve) &&
    typeof gp.operations === "number" &&
    Number.isFinite(gp.operations);
  const rows = d.phase1_countries;
  const hasCountries = Array.isArray(rows) && rows.length > 0;
  return hasLayer1 && hasGlobalSplit && hasCountries;
}

/** 13-1 表 1：/governance/params；数据源自 84 文档镜像 API（非链上真值）。 */
export default function GovernanceParamsPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const diffSectionId = useId();
  const feeSplitSectionId = useId();
  const countriesSectionId = useId();
  const dash = t("ui_em_dash");
  const [data, setData] = useState<ProtocolRef | null>(null);
  /** `undefined` = 加载中；`null` = 失败；否则为成功体 */
  const [pending, setPending] = useState<ProtocolRef | null | undefined>(undefined);
  const [pendingErr, setPendingErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    setPending(undefined);
    setPendingErr(null);
    const headers: Record<string, string> = { "x-request-id": `gov-ref-${Date.now()}` };

    void (async () => {
      try {
        const cur = await fetchJsonWithApiStatusLog<ProtocolRef>(
          "governanceProtocolReference",
          apiUrl(routes.governanceProtocolReference),
          { headers },
        );
        if (cancelledRef.current) return;
        if (!cur.res.ok) throw new Error(String(cur.res.status));
        setData(cur.body);
        setError(null);
      } catch (err) {
        if (cancelledRef.current) return;
        if (typeof window !== "undefined") {
          console.error("GovernanceParamsPage fetch protocol ref:", err);
        }
        setError(mapApiReadError(err, t, "governance_params_load_error"));
        setData(null);
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    })();

    void (async () => {
      try {
        const pen = await fetchJsonWithApiStatusLog<ProtocolRef>(
          "governanceProtocolReferencePending",
          apiUrl(routes.governanceProtocolReferencePending),
          { headers },
        );
        if (cancelledRef.current) return;
        if (!pen.res.ok) throw new Error(String(pen.res.status));
        setPending(pen.body);
        setPendingErr(null);
      } catch (err) {
        if (cancelledRef.current) return;
        if (typeof window !== "undefined") {
          console.error("GovernanceParamsPage fetch protocol ref pending:", err);
        }
        setPending(null);
        setPendingErr(mapApiReadError(err, t, "governance_params_pending_load_error"));
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [t]);

  const l1 = data?.fee_router?.layer1_percent_of_allocatable_platform_fee;
  const gsplit = data?.fee_router?.global_pool_split_percent;
  const diffRows =
    data && pending && protocolReferenceHasSubstance(data) && protocolReferenceHasSubstance(pending)
      ? buildFeeMetricDiffRows(data, pending)
      : null;
  const allMatch =
    diffRows != null && diffRows.length > 0 && diffRows.every((r) => r.cur === r.pen);
  const pendingSource =
    typeof pending?.pending_package_source === "string" && pending.pending_package_source.trim() !== ""
      ? pending.pending_package_source.trim()
      : null;

  return (
    <main className="mx-auto max-w-4xl p-8" aria-labelledby={pageTitleId}>
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_params_title")}
      </h1>
      <p className="mt-2 text-body text-ink-600">{t("governance_params_doc_notice")}</p>
      <GovernanceTargetNotice className="mt-3" />
      {data?.doc_ref && (
        <p className="mt-1 font-mono text-meta text-ink-500">
          {data.doc_ref} · v{data.doc_version ?? dash}
        </p>
      )}
      {data?.note && <p className="mt-2 text-small text-warning dark:text-warning/90">{data.note}</p>}

      {loading ? <div className="mt-6"><LoadingText /></div> : null}
      {error ? (
        <div className="mt-6">
          <ApiErrorAlert message={error} />
        </div>
      ) : null}

      {!loading && !error && data && !protocolReferenceHasSubstance(data) && (
        <p className="mt-6 text-body text-warning dark:text-warning/95" role="alert">
          {t("governance_params_body_incomplete")}
        </p>
      )}

      {!loading && !error && data && protocolReferenceHasSubstance(data) && (
        <>
          <section className="mt-8 overflow-x-auto" aria-labelledby={diffSectionId}>
            <h2 id={diffSectionId} className="text-h4 font-medium text-ink-800">
              {t("governance_params_diff_section")}
            </h2>
            {pendingErr ? (
              <div className="mt-3">
                <ApiErrorAlert message={pendingErr} />
              </div>
            ) : pending === undefined ? (
              <p className="mt-3 text-ink-500 motion-sub animate-pulse" role="status" aria-live="polite">
                {t("governance_params_diff_pending_loading")}
              </p>
            ) : diffRows == null ? (
              <p className="mt-3 text-body text-warning dark:text-warning/95" role="alert">
                {t("governance_params_body_incomplete")}
              </p>
            ) : (
              <>
                <p
                  className={`mt-2 text-small font-medium ${
                    allMatch ? "text-ink-600" : "text-warning dark:text-warning/90"
                  }`}
                >
                  {allMatch ? t("governance_params_diff_all_match") : t("governance_params_diff_some_mismatch")}
                </p>
                {pendingSource ? (
                  <p className="mt-1 text-meta text-ink-500">
                    {t("governance_params_diff_source_hint").replace("{{source}}", pendingSource)}
                  </p>
                ) : null}
                <table className="mt-3 w-full min-w-[520px] border-collapse text-left text-small">
                  <thead>
                    <tr className="border-b border-ink-200 text-ink-600">
                      <th className="py-2 pr-3 font-medium">{t("governance_params_diff_col_metric")}</th>
                      <th className="py-2 pr-3 font-medium">{t("governance_params_diff_col_current")}</th>
                      <th className="py-2 pr-3 font-medium">{t("governance_params_diff_col_pending")}</th>
                      <th className="py-2 font-medium">{t("governance_params_diff_col_match")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffRows.map((row) => {
                      const match = row.cur === row.pen;
                      const bump = !match ? "bg-amber-50 dark:bg-amber-950/25" : "";
                      return (
                        <tr key={row.id} className="border-b border-ink-100 text-ink-800">
                          <td className={`py-2 pr-3 ${bump}`}>{t(row.labelKey)}</td>
                          <td className={`py-2 pr-3 font-mono ${bump}`}>{row.cur}%</td>
                          <td className={`py-2 pr-3 font-mono ${bump}`}>{row.pen}%</td>
                          <td className={`py-2 ${bump}`}>
                            {match ? t("governance_params_diff_match_yes") : t("governance_params_diff_match_no")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </section>

          <section className="mt-8" aria-labelledby={feeSplitSectionId}>
            <h2 id={feeSplitSectionId} className="text-h4 font-medium text-ink-800">
              {t("governance_params_fee_split")}
            </h2>
            {l1 && (
              <ul className="mt-2 list-disc pl-5 text-body text-ink-700">
                <li>
                  {t("governance_params_layer1_country")}: {l1.country_bucket}%
                </li>
                <li>
                  {t("governance_params_layer1_global")}: {l1.global_pool}%
                </li>
              </ul>
            )}
            {gsplit && (
              <ul className="mt-2 list-disc pl-5 text-body text-ink-700">
                <li>TTG {t("governance_params_stakers")}: {gsplit.ttg_stakers}%</li>
                <li>{t("governance_params_reserve")}: {gsplit.reserve}%</li>
                <li>{t("governance_params_operations")}: {gsplit.operations}%</li>
              </ul>
            )}
            {data.fee_router?.orthogonality_ref && (
              <p className="mt-2 text-small text-ink-600">{data.fee_router.orthogonality_ref}</p>
            )}
          </section>

          <section className="mt-10 overflow-x-auto" aria-labelledby={countriesSectionId}>
            <h2 id={countriesSectionId} className="text-h4 font-medium text-ink-800">
              {t("governance_params_phase1_countries")}
            </h2>
            <table className="mt-3 w-full min-w-[640px] border-collapse text-left text-small">
              <thead>
                <tr className="border-b border-ink-200 text-ink-600">
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_country")}</th>
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_tier")}</th>
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_cap_pts")}</th>
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_open_pts")}</th>
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_target_wan")}</th>
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_cap_wan")}</th>
                  <th className="py-2 font-medium">{t("governance_params_col_notes")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.phase1_countries ?? []).map((row) => (
                  <tr key={row.name_zh} className="border-b border-ink-100 text-ink-800">
                    <td className="py-2 pr-3">{row.name_zh}</td>
                    <td className="py-2 pr-3">{row.tier}</td>
                    <td className="py-2 pr-3">{row.national_pool_cap_fee_points}</td>
                    <td className="py-2 pr-3">{row.phase1_open_fee_points}</td>
                    <td className="py-2 pr-3">{row.fundraise_target_cny_wan}</td>
                    <td className="py-2 pr-3">{row.fundraise_cap_cny_wan}</td>
                    <td className="py-2 text-ink-600">{row.notes ?? dash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.checksums && (
              <p className="mt-3 text-meta text-ink-500">
                {JSON.stringify(data.checksums)}
              </p>
            )}
          </section>
        </>
      )}

      <nav className="mt-10 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_title")}
        </Link>
        <Link
          href="/governance/proposals"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_proposals_title")}
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
      </nav>
      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
