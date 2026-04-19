"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type VariantRow = {
  variant_id?: string;
  views?: number;
  clicks?: number;
  ctr?: number;
  weight?: number;
};

type ViewShare = { variant_id?: string; view_share?: number };

type MomentBlock = {
  moment?: string;
  total_views?: number;
  variants?: VariantRow[];
  view_distribution?: ViewShare[];
};

type ObsBody = {
  anchor?: string;
  environment?: string;
  runtime?: {
    autopilot_generation?: number;
    updated_at?: string;
    moments?: Record<string, Record<string, number>>;
  };
  control?: {
    weights_frozen?: boolean;
    force_control_only?: boolean;
    variant_weight_caps?: Record<string, number>;
    control_updated_at?: string;
  };
  metrics?: { by_moment?: MomentBlock[] };
  generation_history?: { autopilot_generation: number; recorded_at: string }[];
  alerts?: {
    code?: string;
    severity?: string;
    moment?: string;
    variant_id?: string;
    detail?: string;
  }[];
  thresholds?: Record<string, unknown>;
};

const VARIANT_BAR_CLASS: Record<string, string> = {
  control: "bg-travel-500",
  minimal_delayed: "bg-ink-400",
  alt_copy: "bg-amber-500",
};

function formatCapsJson(caps: Record<string, number> | undefined): string {
  if (!caps || Object.keys(caps).length === 0) return "{}";
  try {
    return JSON.stringify(caps, null, 2);
  } catch {
    return "{}";
  }
}

function formatPct(x: number | undefined): string {
  if (x === undefined || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(1)}%`;
}

function formatCtr(x: number | undefined): string {
  if (x === undefined || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(2)}%`;
}

/** P-OBS2：信任增长运营控制台（P-OBS1 API 可视化）。 */
export default function AdminTrustGrowthPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const controlSectionId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [data, setData] = useState<ObsBody | null>(null);

  const [draftFrozen, setDraftFrozen] = useState(false);
  const [draftForce, setDraftForce] = useState(false);
  const [capsText, setCapsText] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [rollbackBusy, setRollbackBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const headers: Record<string, string> = { "x-request-id": `admin-tg-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      /* 401 handled below */
    }
    adminFetchJson<ObsBody>("AdminTrustGrowthPage", apiUrl(routes.admin.trustGrowthObservability), { headers })
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) throw new Error("forbidden");
        if (!res.ok) throw new Error((json as { error?: string }).error || `request_failed_${res.status}`);
        return json;
      })
      .then((json) => {
        setData(json);
        const c = json.control;
        if (c) {
          setDraftFrozen(!!c.weights_frozen);
          setDraftForce(!!c.force_control_only);
          setCapsText(formatCapsJson(c.variant_weight_caps as Record<string, number> | undefined));
        }
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminTrustGrowthPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function applyControl() {
    setActionError(null);
    let capsJson: Record<string, number>;
    try {
      const parsed = JSON.parse(capsText || "{}") as unknown;
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("caps_not_object");
      }
      capsJson = parsed as Record<string, number>;
    } catch {
      setActionError(t("admin_trust_growth_err_caps_json"));
      return;
    }

    setSaving(true);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-request-id": `admin-tg-patch-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      setActionError(t("admin_trust_growth_err_auth"));
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(apiUrl(routes.admin.trustGrowthControl), {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          weights_frozen: draftFrozen,
          force_control_only: draftForce,
          variant_weight_caps: capsJson,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (res.status === 401 || res.status === 403) {
        setActionError(t("admin_observability_forbidden"));
        return;
      }
      if (!res.ok) {
        setActionError(j.message || j.error || `HTTP ${res.status}`);
        return;
      }
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function rollback() {
    if (!window.confirm(t("admin_trust_growth_rollback_confirm"))) return;
    setActionError(null);
    setRollbackBusy(true);
    const headers: Record<string, string> = {
      "x-request-id": `admin-tg-rb-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      setActionError(t("admin_trust_growth_err_auth"));
      setRollbackBusy(false);
      return;
    }
    try {
      const res = await fetch(apiUrl(routes.admin.trustGrowthRollbackControl), {
        method: "POST",
        headers,
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (res.status === 401 || res.status === 403) {
        setActionError(t("admin_observability_forbidden"));
        return;
      }
      if (!res.ok) {
        setActionError(j.message || j.error || `HTTP ${res.status}`);
        return;
      }
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setRollbackBusy(false);
    }
  }

  const rt = data?.runtime;
  const genHist = data?.generation_history ?? [];
  const alerts = data?.alerts ?? [];
  const moments = data?.metrics?.by_moment ?? [];

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_trust_growth_title")}
          </h1>
          <p className="mt-2 text-body text-ink-600">{t("admin_trust_growth_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`rounded-[var(--radius-md)] border border-ink-200 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:border-travel-400 ${travelFocusRingOffset2Classes}`}
            onClick={() => load()}
            disabled={loading}
          >
            {t("admin_trust_growth_refresh")}
          </button>
          <Link
            href="/admin"
            className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_schema_back")}
          </Link>
        </div>
      </header>

      <div
        className="mt-4 rounded-[var(--radius-lg)] border border-amber-200/80 bg-amber-50/90 p-4 text-body text-ink-800"
        role="note"
      >
        {t("admin_trust_growth_write_notice")}
      </div>

      {loading ? (
        <p className="mt-6 text-body text-ink-600">{t("admin_trust_growth_loading")}</p>
      ) : error ? (
        <p className="mt-6 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      ) : data ? (
        <div className="mt-6 space-y-8">
          <section
            className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4"
            aria-label={t("admin_trust_growth_section_kpi")}
          >
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_trust_growth_section_kpi")}
            </h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-meta text-ink-500">{t("admin_trust_growth_env")}</dt>
                <dd className="font-mono text-body text-ink-900">{data.environment ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("admin_trust_growth_generation")}</dt>
                <dd className="font-mono text-body text-ink-900">{rt?.autopilot_generation ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("admin_trust_growth_runtime_updated")}</dt>
                <dd className="font-mono text-small text-ink-900">{rt?.updated_at ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section
            className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4"
            aria-labelledby={controlSectionId}
          >
            <h2 id={controlSectionId} className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_trust_growth_section_control")}
            </h2>
            <p className="mt-2 text-meta text-ink-600">{t("admin_trust_growth_control_hint")}</p>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <label className="flex cursor-pointer items-center gap-2 text-body text-ink-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink-300 text-travel-600"
                  checked={draftFrozen}
                  onChange={(e) => setDraftFrozen(e.target.checked)}
                />
                {t("admin_trust_growth_freeze")}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-body text-ink-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink-300 text-travel-600"
                  checked={draftForce}
                  onChange={(e) => setDraftForce(e.target.checked)}
                />
                {t("admin_trust_growth_force_control")}
              </label>
            </div>

            <div className="mt-4">
              <label htmlFor="tg-caps" className="text-small font-medium text-ink-700">
                {t("admin_trust_growth_caps_label")}
              </label>
              <p className="text-meta text-ink-500">{t("admin_trust_growth_caps_hint")}</p>
              <textarea
                id="tg-caps"
                rows={5}
                className="mt-1 w-full max-w-xl rounded-[var(--radius-md)] border border-ink-200 bg-white p-3 font-mono text-meta text-ink-900"
                value={capsText}
                onChange={(e) => setCapsText(e.target.value)}
                spellCheck={false}
              />
            </div>

            {actionError ? (
              <p className="mt-3 text-body text-danger" role="alert">
                {actionError}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className={`rounded-[var(--radius-md)] bg-travel-600 px-4 py-2 text-small font-medium text-white hover:bg-travel-700 disabled:opacity-50 ${travelFocusRingOffset2Classes}`}
                onClick={() => void applyControl()}
                disabled={saving || rollbackBusy}
              >
                {saving ? t("admin_trust_growth_saving") : t("admin_trust_growth_apply")}
              </button>
              <button
                type="button"
                className={`rounded-[var(--radius-md)] border border-amber-300 bg-amber-50 px-4 py-2 text-small font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50 ${travelFocusRingOffset2Classes}`}
                onClick={() => void rollback()}
                disabled={saving || rollbackBusy}
              >
                {rollbackBusy ? t("admin_trust_growth_rollbacking") : t("admin_trust_growth_rollback")}
              </button>
            </div>
          </section>

          <section className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4" aria-label={t("admin_trust_growth_section_alerts")}>
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_trust_growth_section_alerts")}
            </h2>
            {alerts.length === 0 ? (
              <p className="mt-2 text-body text-ink-600">{t("admin_trust_growth_no_alerts")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {alerts.map((a, i) => {
                  const sev = a.severity === "critical" ? "critical" : "warn";
                  return (
                    <li
                      key={`${a.code}-${i}`}
                      className={`rounded-[var(--radius-md)] border px-3 py-2 text-small ${
                        sev === "critical"
                          ? "border-danger-200 bg-danger-50 text-danger-900"
                          : "border-amber-200 bg-amber-50/90 text-ink-900"
                      }`}
                    >
                      <span className="font-mono font-semibold">{a.code}</span>
                      {a.moment ? (
                        <span className="ml-2 text-meta">
                          · {a.moment}
                          {a.variant_id ? ` / ${a.variant_id}` : ""}
                        </span>
                      ) : null}
                      <div className="mt-1 text-meta">{a.detail}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4" aria-label={t("admin_trust_growth_section_timeline")}>
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_trust_growth_section_timeline")}
            </h2>
            <div className="mt-3 max-h-48 overflow-auto">
              <table className="w-full border-collapse text-left text-meta">
                <thead>
                  <tr className="border-b border-ink-200 text-ink-500">
                    <th className="py-1 pr-2 font-medium">{t("admin_trust_growth_generation")}</th>
                    <th className="py-1 font-medium">{t("admin_trust_growth_recorded_at")}</th>
                  </tr>
                </thead>
                <tbody>
                  {genHist.map((h, idx) => (
                    <tr key={`${h.autopilot_generation}-${idx}`} className="border-b border-ink-100 font-mono text-ink-800">
                      <td className="py-1 pr-2">{h.autopilot_generation}</td>
                      <td className="py-1">{h.recorded_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-6" aria-label={t("admin_trust_growth_section_metrics")}>
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_trust_growth_section_metrics")}
            </h2>
            {moments.map((m) => (
              <div
                key={m.moment ?? "?"}
                className="rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-body font-semibold text-ink-900">{m.moment ?? "—"}</h3>
                  <span className="text-meta text-ink-500">
                    {t("admin_trust_growth_total_views")}: {m.total_views ?? 0}
                  </span>
                </div>

                <div className="mt-3" aria-hidden>
                  <div className="flex h-4 w-full overflow-hidden rounded-sm bg-ink-100">
                    {(m.view_distribution ?? []).map((d) => {
                      const vid = d.variant_id ?? "";
                      const w = Math.max(0, (d.view_share ?? 0) * 100);
                      const bar = VARIANT_BAR_CLASS[vid] ?? "bg-ink-300";
                      return (
                        <div
                          key={vid}
                          className={`${bar} min-w-0 transition-[width]`}
                          style={{ width: `${w}%` }}
                          title={`${vid}: ${formatPct(d.view_share)}`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-meta text-ink-600">
                    {(m.view_distribution ?? []).map((d) => (
                      <span key={d.variant_id}>
                        <span className="font-mono">{d.variant_id}</span>: {formatPct(d.view_share)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[28rem] border-collapse text-left text-small">
                    <thead>
                      <tr className="border-b border-ink-200 text-meta text-ink-500">
                        <th className="py-2 pr-2 font-medium">{t("admin_trust_growth_variant")}</th>
                        <th className="py-2 pr-2 font-medium">{t("admin_trust_growth_views")}</th>
                        <th className="py-2 pr-2 font-medium">{t("admin_trust_growth_clicks")}</th>
                        <th className="py-2 pr-2 font-medium">{t("admin_trust_growth_ctr")}</th>
                        <th className="py-2 font-medium">{t("admin_trust_growth_weight")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(m.variants ?? []).map((v) => (
                        <tr key={v.variant_id} className="border-b border-ink-100 font-mono text-ink-800">
                          <td className="py-2 pr-2">{v.variant_id}</td>
                          <td className="py-2 pr-2">{v.views ?? 0}</td>
                          <td className="py-2 pr-2">{v.clicks ?? 0}</td>
                          <td className="py-2 pr-2">{formatCtr(v.ctr)}</td>
                          <td className="py-2">{v.weight !== undefined ? v.weight.toFixed(1) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-small text-travel-600 hover:underline">
                    {t("admin_trust_growth_weights_json")}
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
                    {JSON.stringify(rt?.moments?.[m.moment ?? ""] ?? {}, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </section>

          <section className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4" aria-label={t("admin_trust_growth_section_thresholds")}>
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_trust_growth_section_thresholds")}
            </h2>
            <pre className="mt-2 max-h-48 overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
              {JSON.stringify(data.thresholds ?? {}, null, 2)}
            </pre>
          </section>
        </div>
      ) : null}
    </main>
  );
}
