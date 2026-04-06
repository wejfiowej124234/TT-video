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

type AdminUserDetailRes = {
  status?: string;
  error?: string;
  user?: Record<string, unknown>;
  meta?: unknown;
};

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** 70：用户监管详情；须 admin；响应不含 password_hash。 */
function AdminUserDetailPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const userId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminUserDetailRes | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-user-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminUserDetailRes>(
      "AdminUserDetailPage",
      apiUrl(routes.admin.userById(userId)),
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
        logAdminFetch("AdminUserDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const user = body?.user && typeof body.user === "object" ? body.user : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  const rows: { key: string; labelKey: string }[] = [
    { key: "id", labelKey: "admin_user_detail_id" },
    { key: "email", labelKey: "admin_users_colEmail" },
    { key: "role", labelKey: "admin_users_colRole" },
    { key: "kyc_status", labelKey: "admin_users_colKyc" },
    { key: "nickname", labelKey: "admin_user_detail_nickname" },
    { key: "avatar_url", labelKey: "admin_user_detail_avatarUrl" },
    { key: "default_wallet_address", labelKey: "admin_user_detail_wallet" },
    { key: "created_at", labelKey: "admin_users_colCreated" },
    { key: "updated_at", labelKey: "admin_user_detail_updatedAt" },
  ];

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_user_detail_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600 font-mono text-meta break-all">
            {userId || t("admin_em_dash")}
          </p>
          <p className="mt-1 text-small text-ink-500">{t("admin_user_detail_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/users" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_user_detail_back_list")}
          </Link>
          <Link href="/admin/approvals" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_users_linkApprovals")}
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

      <section className="mt-6 space-y-4" aria-label={t("admin_user_detail_panel_aria")}>
        {!userId ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {t("admin_user_detail_missingId")}
          </p>
        ) : loading ? (
          <p className="text-body text-ink-600" role="status">
            {t("admin_users_loading")}
          </p>
        ) : error ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : !user ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <div className="rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft">
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_user_detail_user_section")}
            </h2>
            <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
              {rows.map(({ key, labelKey }) => {
                const raw = user[key];
                const display = fmt(raw) || t("admin_em_dash");
                return (
                  <div key={key} className="border-b border-ink-100 pb-2 last:border-0 sm:border-0 sm:pb-0">
                    <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                    <dd className="mt-0.5 break-all font-mono text-meta text-ink-800">{display}</dd>
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

export default function AdminUserDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_user_detail_title">
      <AdminUserDetailPageInner />
    </AdminSearchParamsSuspense>
  );
}

