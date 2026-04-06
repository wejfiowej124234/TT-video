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

type AdminDisputeDetailRes = {
  status?: string;
  error?: string;
  dispute?: Record<string, unknown>;
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

/** 70：争议监管详情；与 `GET /api/v1/disputes/:id` 成功响应同形（须 admin）。 */
function AdminDisputeDetailPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const disputeId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminDisputeDetailRes | null>(null);

  useEffect(() => {
    if (!disputeId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-dispute-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminDisputeDetailRes>(
      "AdminDisputeDetailPage",
      apiUrl(routes.admin.disputeById(disputeId)),
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
        logAdminFetch("AdminDisputeDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [disputeId]);

  const dispute = body?.dispute && typeof body.dispute === "object" ? body.dispute : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;
  const orderId = typeof dispute?.order_id === "string" ? dispute.order_id : "";

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_dispute_detail_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600 font-mono text-meta break-all">
            {disputeId || t("admin_em_dash")}
          </p>
          <p className="mt-1 text-small text-ink-500">{t("admin_dispute_detail_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/disputes" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_dispute_detail_back_list")}
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

      <section className="mt-6 space-y-4" aria-label={t("admin_dispute_detail_panel_aria")}>
        {!disputeId ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {t("admin_dispute_detail_missingId")}
          </p>
        ) : loading ? (
          <p className="text-body text-ink-600" role="status">
            {t("admin_loading")}
          </p>
        ) : error ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : !dispute ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <div className="rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft">
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_dispute_detail_dispute_section")}
            </h2>
            <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
              {(
                [
                  ["id", t("admin_disputes_colDisputeId")],
                  ["order_id", t("admin_disputes_colOrderId")],
                  ["status", t("admin_disputes_colStatus")],
                  ["arbitrator_id", t("admin_disputes_colArbitrator")],
                  ["refund_ratio", t("admin_dispute_detail_refundRatio")],
                  ["slash_guide", t("admin_dispute_detail_slashGuide")],
                  ["dispute_sequence", t("admin_dispute_detail_sequence")],
                  ["arb_fee_paid", t("admin_dispute_detail_arbFeePaid")],
                  ["created_at", t("admin_disputes_colCreated")],
                  ["updated_at", t("admin_dispute_detail_updatedAt")],
                  ["resolved_at", t("admin_dispute_detail_resolvedAt")],
                ] as const
              ).map(([key, label]) => {
                const raw = dispute[key];
                const display = fmt(raw) || t("admin_em_dash");
                return (
                  <div key={key} className="border-b border-ink-100 pb-2 last:border-0 sm:border-0 sm:pb-0">
                    <dt className="text-meta text-ink-500">{label}</dt>
                    <dd className="mt-0.5 break-all font-mono text-meta text-ink-800">{display}</dd>
                  </div>
                );
              })}
            </dl>
            <div className="mt-3">
              <h3 className="text-meta font-medium text-ink-600">{t("admin_dispute_detail_evidenceHashes")}</h3>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-[var(--radius-md)] bg-bg-console p-3 text-meta text-ink-700">
                {fmt(dispute.evidence_hashes) || t("admin_em_dash")}
              </pre>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-small">
              {orderId ? (
                <Link
                  href={`/admin/orders/${encodeURIComponent(orderId)}`}
                  className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium ${travelFocusRingOffset2Classes}`}
                >
                  {t("admin_dispute_detail_linkOrderAdmin")}
                </Link>
              ) : null}
              <Link
                href={`/disputes/${encodeURIComponent(disputeId)}`}
                className={`${touchTargetLink44Classes} text-travel-600/90 hover:underline ${travelFocusRingOffset2Classes}`}
              >
                {t("admin_disputes_opsOpen")}
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function AdminDisputeDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_dispute_detail_title">
      <AdminDisputeDetailPageInner />
    </AdminSearchParamsSuspense>
  );
}

