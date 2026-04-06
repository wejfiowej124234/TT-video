"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type AdminApprovalDetailRes = {
  status?: string;
  error?: string;
  approval_request?: Record<string, unknown>;
  meta?: unknown;
};

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

/** 审批单监管详情（只读）；须 admin；无 PostgreSQL 时接口 503。 */
function AdminApprovalDetailPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const approvalId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminApprovalDetailRes | null>(null);

  useEffect(() => {
    if (!approvalId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-approval-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminApprovalDetailRes>(
      "AdminApprovalDetailPage",
      apiUrl(routes.admin.approvalById(approvalId)),
      { headers },
    )
      .then(({ res, body: json }) => {
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminApprovalDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [approvalId]);

  const row =
    body?.approval_request && typeof body.approval_request === "object" ? body.approval_request : null;

  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  const rows: { key: string; labelKey: string }[] = [
    { key: "id", labelKey: "admin_approvals_colId" },
    { key: "action", labelKey: "admin_approvals_colAction" },
    { key: "resource_type", labelKey: "admin_approval_detail_resourceType" },
    { key: "resource_id", labelKey: "admin_approval_detail_resourceId" },
    { key: "requested_by", labelKey: "admin_approvals_colRequestedBy" },
    { key: "approved_by", labelKey: "admin_approval_detail_approvedBy" },
    { key: "status", labelKey: "admin_approvals_colStatus" },
    { key: "reason", labelKey: "admin_approval_detail_reason" },
    { key: "approve_reason", labelKey: "admin_approval_detail_approveReason" },
    { key: "created_at", labelKey: "admin_approval_detail_createdAt" },
    { key: "approved_at", labelKey: "admin_approval_detail_approvedAt" },
    { key: "before_payload", labelKey: "admin_approval_detail_beforePayload" },
    { key: "after_payload", labelKey: "admin_approval_detail_afterPayload" },
  ];

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_approval_detail_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600 font-mono text-meta break-all">
            {approvalId || t("admin_em_dash")}
          </p>
          <p className="mt-1 text-small text-ink-500">{t("admin_approval_detail_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/approvals" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_approval_detail_back_list")}
          </Link>
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

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 space-y-4" aria-label={t("admin_approval_detail_panel_aria")}>
        {!approvalId ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {t("admin_approval_detail_missingId")}
          </p>
        ) : loading ? (
          <p className="text-body text-ink-600" role="status">
            {t("admin_loading")}
          </p>
        ) : error ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : !row ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <div className="rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft">
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_approval_detail_section")}
            </h2>
            <dl className="mt-3 grid gap-2 text-body">
              {rows.map(({ key, labelKey }) => {
                const raw = row[key];
                let display: string;
                if (key === "created_at" || key === "approved_at") {
                  display =
                    typeof raw === "string" && raw.trim()
                      ? new Date(raw).toLocaleString()
                      : fmt(raw) || t("admin_em_dash");
                } else {
                  display = fmt(raw) || t("admin_em_dash");
                }
                return (
                  <div key={key} className="border-b border-ink-100 pb-2 last:border-0">
                    <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-all font-mono text-meta text-ink-800">
                      {display}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}
      </section>
    </main>
  );
}

export default function AdminApprovalDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_approval_detail_title">
      <AdminApprovalDetailPageInner />
    </AdminSearchParamsSuspense>
  );
}

