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
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type AdminReviewDetailRes = {
  status?: string;
  error?: string;
  review?: Record<string, unknown>;
  meta?: { source?: string; build?: unknown };
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

/** 70：评价监管详情；须 admin。 */
function AdminReviewDetailPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const reviewId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminReviewDetailRes | null>(null);

  useEffect(() => {
    if (!reviewId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-review-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminReviewDetailRes>(
      "AdminReviewDetailPage",
      apiUrl(routes.admin.reviewById(reviewId)),
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
        logAdminFetch("AdminReviewDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [reviewId]);

  const review = body?.review && typeof body.review === "object" ? body.review : null;
  const source = typeof body?.meta?.source === "string" ? body.meta.source : "";
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;
  const orderId = typeof review?.order_id === "string" ? review.order_id : "";

  const rows: { key: string; labelKey: string }[] = [
    { key: "order_id", labelKey: "admin_reviews_colOrder" },
    { key: "score", labelKey: "admin_reviews_colScore" },
    { key: "weight", labelKey: "admin_review_detail_weight" },
    { key: "reviewer_id", labelKey: "admin_reviews_colReviewer" },
    { key: "reviewee_id", labelKey: "admin_review_detail_reviewee" },
    { key: "comment", labelKey: "admin_reviews_colComment" },
    { key: "created_at", labelKey: "admin_reviews_colCreated" },
  ];

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_review_detail_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600 font-mono text-meta break-all">
            {reviewId || t("admin_em_dash")}
          </p>
          <p className="mt-1 text-small text-ink-500">{t("admin_review_detail_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/reviews" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_review_detail_back_list")}
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

      <section className="mt-6 space-y-4" aria-label={t("admin_review_detail_panel_aria")}>
        {!reviewId ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {t("admin_review_detail_missingId")}
          </p>
        ) : loading ? (
          <p className="text-body text-ink-600" role="status">
            {t("admin_loading")}
          </p>
        ) : error ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : !review ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <>
            <div className="rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft">
              <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_review_detail_review_section")}
              </h2>
              <p className="mt-2 text-meta text-ink-600">
                {t("admin_review_detail_metaSource")}:{" "}
                <span className="font-mono text-ink-800">{source || t("admin_em_dash")}</span>
              </p>
              <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
                <div className="border-b border-ink-100 pb-2 sm:border-0 sm:pb-0">
                  <dt className="text-meta text-ink-500">{t("admin_review_detail_reviewId")}</dt>
                  <dd className="mt-0.5 break-all font-mono text-meta text-ink-800">
                    {fmt(review.id) || t("admin_em_dash")}
                  </dd>
                </div>
                {rows.map(({ key, labelKey }) => {
                  const raw = review[key];
                  const display = fmt(raw) || t("admin_em_dash");
                  return (
                    <div key={key} className="border-b border-ink-100 pb-2 last:border-0 sm:border-0 sm:pb-0">
                      <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                      <dd className="mt-0.5 break-all font-mono text-meta text-ink-800">{display}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-4 flex flex-wrap gap-3 text-small">
                {orderId ? (
                  <Link
                    href={`/admin/orders/${encodeURIComponent(orderId)}`}
                    className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium ${travelFocusRingOffset2Classes}`}
                  >
                    {t("admin_review_detail_linkOrderAdmin")}
                  </Link>
                ) : null}
                {orderId ? (
                  <Link
                    href={`/escrow/${encodeURIComponent(orderId)}`}
                    onClick={() => stashEscrowOrderPrefetchForOrderIdNav(orderId, "escrow")}
                    className={`${touchTargetLink44Classes} text-travel-600/90 hover:underline ${travelFocusRingOffset2Classes}`}
                  >
                    {t("admin_ops_orderEscrow")}
                  </Link>
                ) : null}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default function AdminReviewDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_review_detail_title">
      <AdminReviewDetailPageInner />
    </AdminSearchParamsSuspense>
  );
}

