"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, writeRequestHeaders } from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type ApprovalItem = {
  id: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  requested_by?: string;
  approved_by?: string | null;
  status?: string;
  reason?: string | null;
  approve_reason?: string | null;
  created_at?: string;
  approved_at?: string | null;
};

type ApprovalRes = {
  status?: string;
  items?: ApprovalItem[];
  note?: string;
  meta?: unknown;
  applied_filters?: Record<string, unknown>;
  error?: string;
};

function clampApprovalLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(200, Math.max(1, Math.floor(n)));
}

/** 无 `status` 键 → 默认 pending；`status=` 空 → 不按状态过滤（全量）。 */
function parseApprovalsListQuery(sp: URLSearchParams): { limit: number; status: string | undefined } {
  const limit = clampApprovalLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  let status: string | undefined;
  if (!sp.has("status")) {
    status = "pending";
  } else {
    const s = (sp.get("status") ?? "").trim();
    status = s === "" ? undefined : s;
  }
  return { limit, status };
}

function buildApprovalsListPath(q: { limit: number; status: string | undefined }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampApprovalLimit(q.limit)));
  if (q.status === undefined) {
    sp.set("status", "");
  } else {
    sp.set("status", q.status);
  }
  return `/admin/approvals?${sp.toString()}`;
}

function AdminApprovalsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const statusFilterId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const approvalsListFilterHintId = useId();
  const approvalsApproveFilterHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseApprovalsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftStatus, setDraftStatus] = useState(() => (listQ.status === undefined ? "" : listQ.status));

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftStatus(listQ.status === undefined ? "" : listQ.status);
  }, [listQ.limit, listQ.status]);

  const [approveReason, setApproveReason] = useState<Record<string, string>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNote(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-approvals-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    void adminFetchJson<ApprovalRes>(
      "AdminApprovalsPage.load",
      apiUrl(
        routes.admin.approvals({
          limit: listQ.limit,
          ...(listQ.status !== undefined ? { status: listQ.status } : {}),
        }),
      ),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setItems(Array.isArray(body.items) ? body.items : []);
        const m = isAdminMetaRecord(body.meta) ? body.meta : null;
        setMeta(m);
        const metaNote = m && typeof m.note === "string" ? m.note : null;
        setNote(metaNote ?? (typeof body.note === "string" ? body.note : null));
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminApprovalsPage.load", e);
        setError(adminFetchErrorKind(e));
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [listQ.limit, listQ.status, reloadTick]);

  const bumpReload = () => setReloadTick((x) => x + 1);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampApprovalLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftStatus.trim();
    router.push(
      buildApprovalsListPath({
        limit: lim,
        status: st === "" ? undefined : st,
      }),
    );
  };

  const reset = () => {
    router.push("/admin/approvals?limit=100");
  };

  const approve = async (id: string) => {
    setApprovingId(id);
    setError(null);

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      setError(adminFetchErrorKind(new Error("request_failed_401")));
      setApprovingId(null);
      return;
    }

    const reason = approveReason[id]?.trim();
    try {
      const { res, body } = await adminFetchJson<{ error?: string }>(
        "AdminApprovalsPage.approve",
        apiUrl(routes.admin.approvalApprove(id)),
        {
          method: "POST",
          headers,
          body: JSON.stringify({ reason: reason || null }),
        },
      );
      if (!res.ok) {
        throw new Error(body.error || `request_failed_${res.status}`);
      }
      bumpReload();
    } catch (e: unknown) {
      logAdminFetch("AdminApprovalsPage.approve", e);
      setError(adminFetchErrorKind(e));
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_approvals_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_approvals_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/users" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_approvals_linkUsers")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_schema_back")}
          </Link>
        </div>
      </header>

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id="admin-approvals-filter-form"
          aria-label={t("admin_approvals_filters")}
          aria-describedby={
            [
              approvalsListFilterHintId,
              adminListApplyResetHintId,
              !loading && !error && appliedFilters ? adminAppliedFiltersDescId : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <h2 className="text-body font-medium text-ink-800">{t("admin_approvals_filters")}</h2>
          <p id={approvalsListFilterHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_approvals_list_filter_hint")}
          </p>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <label className="text-small text-ink-700" htmlFor={statusFilterId}>
              {t("admin_approvals_statusLabel")}
              <select
                id={statusFilterId}
                name="status"
                className={`mt-1 inline-flex w-full min-h-[44px] min-w-[10rem] items-center justify-start rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
              >
                <option value="pending">{t("admin_approvals_optPending")}</option>
                <option value="approved">{t("admin_approvals_optApproved")}</option>
                <option value="rejected">{t("admin_approvals_optRejected")}</option>
                <option value="cancelled">{t("admin_approvals_optCancelled")}</option>
                <option value="">{t("admin_approvals_optAll")}</option>
              </select>
            </label>
            <label className="text-small text-ink-700">
              {t("admin_approvals_limitLabel")}
              <input
                name="limit"
                className={`mt-1 block min-h-[44px] w-24 rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                type="number"
                min={1}
                max={200}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
              />
            </label>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-approvals-filter-form"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-3 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            type="submit"
          >
            {t("admin_approvals_apply")}
          </button>
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            <button
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              type="submit"
            >
              {t("admin_approvals_reset")}
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_loading")}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && appliedFilters && (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card">
          {t("admin_approvals_applied")} {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && note ? <AdminMetaNoteLink className="mt-3">{note}</AdminMetaNoteLink> : null}

      {!loading && !error && (
        <>
          <p id={approvalsApproveFilterHintId} className="mt-6 text-meta text-ink-600 leading-relaxed">
            {t("admin_approvals_approve_filter_hint")}
          </p>
        <section className="mt-2 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_approvals_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin_approvals_colId")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_approvals_colAction")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_approvals_colResource")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_approvals_colRequestedBy")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_approvals_colStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_approvals_colApprove")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_approvals_colOps")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-ink-500" colSpan={7}>
                    {t("admin_empty_table")}
                  </td>
                </tr>
              )}
              {items.map((item) => {
                const canApprove = item.status === "pending";
                const id = item.id;
                return (
                  <tr key={id}>
                    <td className="px-4 py-3">{id}</td>
                    <td className="px-4 py-3">{item.action ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-3">
                      {item.resource_type ?? t("admin_em_dash")}:{item.resource_id ?? t("admin_em_dash")}
                    </td>
                    <td className="px-4 py-3">{item.requested_by ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-3">{item.status ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-3">
                      {canApprove ? (
                        <form
                          className="flex min-w-[240px] flex-col gap-2"
                          aria-describedby={approvalsApproveFilterHintId}
                          onSubmit={(e) => {
                            e.preventDefault();
                            void approve(id);
                          }}
                        >
                          <input
                            className={`min-h-[44px] w-full rounded-[var(--radius-md)] border border-ink-300 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
                            placeholder={t("admin_approvals_approvePh")}
                            value={approveReason[id] ?? ""}
                            onChange={(e) =>
                              setApproveReason((prev) => ({ ...prev, [id]: e.target.value }))
                            }
                          />
                          <button
                            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-3 py-1.5 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
                            type="submit"
                            disabled={approvingId === id}
                            aria-busy={approvingId === id ? true : undefined}
                          >
                            {approvingId === id ? t("admin_approvals_approving") : t("admin_approvals_approve")}
                          </button>
                        </form>
                      ) : (
                        <span className="text-ink-500">{t("admin_em_dash")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/approvals/${encodeURIComponent(id)}`}
                        className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                      >
                        {t("admin_ops_approvalDetailAdmin")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        </>
      )}
    </main>
  );
}

export default function AdminApprovalsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_approvals_title">
      <AdminApprovalsPageInner />
    </AdminSearchParamsSuspense>
  );
}

