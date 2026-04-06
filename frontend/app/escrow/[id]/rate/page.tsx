"use client";

import { useState, useCallback, useEffect, useId, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { getOrder, orderConfirmRating, getIdempotencyKey } from "@/lib/apiClient";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { OrderResponse, OrderRow } from "@/components/escrow/EscrowDetail/types";
import { stashEscrowOrderPrefetchForRatingPageMainNav } from "@/lib/orderEscrowPrefetch";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  EscrowRatePageSkeleton,
  EscrowRateRouteSuspense,
  escrowRatePanelClass as panelClass,
  escrowRateZoneClass as zoneClass,
} from "@/components/escrow/EscrowRateRouteSuspense";
import ReviewBlock from "@/components/escrow/EscrowDetail/ReviewBlock";

const RATE_NAV_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-[var(--radius-sm)]";

/** 04 GET /orders/:id：标准包为 `{ order, itinerary? }`；单测/旧桩可能扁平 */
function normalizeGetOrderPayload(raw: unknown): {
  orderResponse: OrderResponse;
  orderSlice: {
    state?: string;
    sub_status?: string;
    rating_deadline?: string | null;
    rating_tourist_confirmed?: boolean;
    rating_guide_confirmed?: boolean;
  } | null;
} {
  if (!raw || typeof raw !== "object") {
    return { orderResponse: {}, orderSlice: null };
  }
  const r = raw as Record<string, unknown>;
  const nested = r.order;
  if (nested && typeof nested === "object") {
    const row = nested as OrderRow;
    return {
      orderResponse: raw as OrderResponse,
      orderSlice: {
        state: typeof row.state === "string" ? row.state : undefined,
        sub_status: typeof row.sub_status === "string" ? row.sub_status : undefined,
        rating_deadline:
          row.rating_deadline === null || row.rating_deadline === undefined
            ? null
            : String(row.rating_deadline),
        rating_tourist_confirmed: row.rating_tourist_confirmed === true,
        rating_guide_confirmed: row.rating_guide_confirmed === true,
      },
    };
  }
  const row = raw as OrderRow;
  return {
    orderResponse: { order: row },
    orderSlice: {
      state: typeof row.state === "string" ? row.state : undefined,
      sub_status: typeof row.sub_status === "string" ? row.sub_status : undefined,
      rating_deadline:
        row.rating_deadline === null || row.rating_deadline === undefined
          ? null
          : String(row.rating_deadline),
      rating_tourist_confirmed: row.rating_tourist_confirmed === true,
      rating_guide_confirmed: row.rating_guide_confirmed === true,
    },
  };
}

/** 53-S8：行程评分页 — 上传照片/视频、审核、双方确认后触发释放；与 §4.6.2、§5.3、30-DID 一致 */
type RatingPhase =
  | "pending_upload"
  | "under_review"
  | "waiting_other"
  | "both_confirmed"
  | "released"
  /** 资金终态但非 Completed：仅链下文字评价；无 POST confirm-rating / 链上释放引导（与 dispute_bilateral_rating 一致） */
  | "review_only";

/** 与 `traveltrust_core::can_submit_review` 终态一致（链下评价 POST 门禁） */
function orderStateAllowsOffChainTextReviews(state?: string): boolean {
  const s = String(state ?? "").trim().toLowerCase();
  return s === "completed" || s === "refunded" || s === "partially_refunded" || s === "slashed";
}

/** 与 `order_confirm_rating_impl` 一致：仅 Completed 可确认评分 */
function orderStateAllowsConfirmRating(state?: string): boolean {
  return String(state ?? "").trim().toLowerCase() === "completed";
}

function EscrowRatePageInner() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { t } = useTranslation();
  const [order, setOrder] = useState<{
    state?: string;
    sub_status?: string;
    rating_deadline?: string | null;
  } | null>(null);
  const [orderResponseForPrefetch, setOrderResponseForPrefetch] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderLoadError, setOrderLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<RatingPhase>("pending_upload");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 提交「上传」后为真：无实际上传 API，仅刷新订单后提示用户以服务器阶段为准 */
  const [uploadServerSyncHint, setUploadServerSyncHint] = useState(false);
  const ratingIdempotencyKeyRef = useRef<string | null>(null);
  const orderFetchGen = useRef(0);
  const uploadSubmitHintId = useId();
  const ratePageH1Id = useId();
  const rateUploadHeadingId = useId();
  const rateFileInputId = useId();
  const rateFileHintId = useId();
  const rateReleaseCtaHeadingId = useId();

  const loadOrder = useCallback(
    (refreshOnly = false): Promise<void> => {
      if (!id) return Promise.resolve();
      const gen = ++orderFetchGen.current;
      if (!refreshOnly) {
        setLoading(true);
        setOrderLoadError(null);
      }
      return getOrder(id)
        .then((raw) => {
          if (gen !== orderFetchGen.current) return;
          const { orderResponse, orderSlice } = normalizeGetOrderPayload(raw);
          if (!orderSlice) {
            setOrder(null);
            setOrderResponseForPrefetch(null);
            setPhase("pending_upload");
            return;
          }
          setOrderResponseForPrefetch(orderResponse.order != null ? orderResponse : null);
          setOrder({
            state: orderSlice.state,
            sub_status: orderSlice.sub_status,
            rating_deadline: orderSlice.rating_deadline,
          });
          const sub = orderSlice.sub_status;
          const stateNorm = String(orderSlice.state ?? "").toLowerCase();
          const rt = orderSlice.rating_tourist_confirmed === true;
          const rg = orderSlice.rating_guide_confirmed === true;
          const bothRatingDone = sub === "rating_confirmed" || (rt && rg);
          const reviewable = orderStateAllowsOffChainTextReviews(orderSlice.state);
          const canConfirmRating = orderStateAllowsConfirmRating(orderSlice.state);
          // API：`order_state_to_str` 为 snake_case（如 completed）；兼容历史 PascalCase
          if (stateNorm === "released") setPhase("released");
          else if (reviewable && !canConfirmRating) setPhase("review_only");
          else if (stateNorm === "completed" && bothRatingDone) setPhase("both_confirmed");
          else if (stateNorm === "completed" && (sub === "rating_pending" || !sub || !bothRatingDone))
            setPhase("waiting_other");
          else setPhase("pending_upload");
        })
        .catch((err) => {
          if (gen !== orderFetchGen.current) {
            return;
          }
          if (typeof window !== "undefined") {
            console.error("EscrowRatePage getOrder:", err);
          }
          if (refreshOnly) {
            setError(mapApiReadError(err, t, "escrow_loadFailed"));
          } else {
            setOrder(null);
            setOrderResponseForPrefetch(null);
            setOrderLoadError(mapApiReadError(err, t, "escrow_loadFailed"));
          }
          throw err;
        })
        .finally(() => {
          if (gen !== orderFetchGen.current) return;
          setLoading(false);
        });
    },
    [id, t]
  );

  useEffect(() => {
    void loadOrder().catch(() => {});
  }, [loadOrder]);

  const stashEscrowMainPrefetch = useCallback(() => {
    if (!id) return;
    const head =
      order != null
        ? {
            id,
            state: order.state,
            sub_status: order.sub_status,
            rating_deadline: order.rating_deadline,
          }
        : null;
    stashEscrowOrderPrefetchForRatingPageMainNav(id, orderResponseForPrefetch, head);
  }, [id, orderResponseForPrefetch, order]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles((prev) => [...prev, ...list].slice(0, 10));
    setError(null);
    setUploadServerSyncHint(false);
  };

  const submitUpload = () => {
    setSubmitting(true);
    setError(null);
    setUploadServerSyncHint(false);
    void loadOrder(true)
      .then(() => {
        setUploadServerSyncHint(true);
      })
      .catch(() => {})
      .finally(() => {
        setSubmitting(false);
      });
  };

  const confirmRating = async () => {
    setSubmitting(true);
    setError(null);
    const key = ratingIdempotencyKeyRef.current ?? (ratingIdempotencyKeyRef.current = getIdempotencyKey());
    try {
      await orderConfirmRating(id, key);
      try {
        await loadOrder(true);
      } catch {
        // refreshOnly：失败时 loadOrder 内已 setError，勿覆盖为 confirm 文案
      }
    } catch (e) {
      if (typeof window !== "undefined") {
        console.error("EscrowRate confirmRating:", e);
      }
      setError(mapApiReadError(e, t, "order_error_rating_confirm_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return (
      <main className={`${zoneClass} max-w-3xl mx-auto`} aria-label={t("rate_pageTitle")}>
        <h1 className="sr-only">{t("common_errorMessage")}</h1>
        <p className="text-small text-slate-300">{t("common_errorMessage")}</p>
        <Link href="/orders" className={`text-cyan-300 hover:text-cyan-100 ${RATE_NAV_FOCUS}`}>{t("escrow_backToOrders")}</Link>
        <ProductCrossNav
          ariaLabelKey="rate_relatedNav_aria"
          showGuides
          className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-slate-300"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 ${RATE_NAV_FOCUS}`}
          separatorClassName="text-slate-500"
        />
      </main>
    );
  }

  if (loading) {
    return <EscrowRatePageSkeleton t={t} />;
  }

  if (orderLoadError) {
    return (
      <main className="min-h-screen bg-bg-main text-ink-800" aria-label={t("rate_pageTitle")}>
        <h1 className="sr-only">{t("escrow_loadFailed")}</h1>
        <div className="container py-8 md:py-12 max-w-lg">
          <ApiErrorAlert message={orderLoadError} />
          <div className="mt-4 flex flex-wrap gap-3">
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                void loadOrder();
              }}
            >
              <button
                type="submit"
                className="rounded-[var(--radius-sm)] bg-cyan-500/80 hover:bg-cyan-500 px-4 py-2 text-white text-small font-medium"
              >
                {t("common_retry")}
              </button>
            </form>
            <Link
              href="/orders"
              className="inline-flex items-center rounded-[var(--radius-sm)] border border-slate-500 px-4 py-2 text-small text-cyan-300 hover:text-cyan-100 hover:bg-slate-800/60"
            >
              {t("escrow_backToOrders")}
            </Link>
          </div>
          <ProductCrossNav ariaLabelKey="rate_relatedNav_aria" showGuides className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-main text-ink-800" aria-labelledby={ratePageH1Id}>
      <div className="container py-8 md:py-12">
        <div data-zone="order-protocol" className={zoneClass}>
          <header className="flex flex-wrap items-center justify-between gap-4">
            <h1 id={ratePageH1Id} className="text-h3 font-semibold text-cyan-200">{t("rate_pageTitle")}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-end">
              <Link
                href={`/escrow/${encodeURIComponent(id)}`}
                onClick={stashEscrowMainPrefetch}
                className="text-small font-medium text-cyan-300 hover:text-cyan-100 hover:drop-shadow-scifi-cyan-lg rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                ← {t("escrow_backToOrders")}
              </Link>
              <Link
                href={`/pay?orderId=${encodeURIComponent(id)}`}
                onClick={stashEscrowMainPrefetch}
                className="text-small font-medium text-cyan-300 hover:text-cyan-100 hover:underline rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {t("orders_payHub")}
              </Link>
            </div>
          </header>
          <p className="text-small text-slate-300" role="note">
            {t("rate_reviewWindowHint")}
          </p>
          {order?.rating_deadline &&
            phase !== "both_confirmed" &&
            phase !== "released" &&
            phase !== "review_only" &&
            !Number.isNaN(Date.parse(order.rating_deadline)) && (
              <p className="text-small text-slate-300 mt-1" role="note">
                {t("order_ratingDeadlineHint").replace(
                  "{{date}}",
                  new Date(order.rating_deadline).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  }),
                )}
              </p>
            )}

          {phase === "review_only" ? (
            <section className={panelClass} role="note" aria-labelledby={rateUploadHeadingId}>
              <h2 id={rateUploadHeadingId} className="text-body font-semibold text-cyan-200 mb-2">
                {t("rate_reviewOnlyTitle")}
              </h2>
              <p className="text-small text-slate-300">{t("rate_reviewOnlyBody")}</p>
            </section>
          ) : (
            <section className={panelClass} aria-labelledby={rateUploadHeadingId}>
              <h2 id={rateUploadHeadingId} className="text-body font-semibold text-cyan-200 mb-2">
                {t("rate_uploadTitle")}
              </h2>
              <p className="text-small text-slate-300 mb-4">{t("rate_uploadHint")}</p>
              <div
                className="border-2 border-dashed border-cyan-500/40 rounded-[var(--radius-md)] p-8 text-center text-slate-300 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/30"
                role="group"
                aria-label={t("rate_uploadTitle")}
              >
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={onFileChange}
                  className="sr-only"
                  id={rateFileInputId}
                  aria-label={t("rate_uploadInput_aria")}
                  aria-describedby={rateFileHintId}
                />
                <label htmlFor={rateFileInputId} className="cursor-pointer block">
                  <span className="text-small">{t("rate_uploadHint")}</span>
                </label>
                <p id={rateFileHintId} className="text-meta mt-2">
                  {files.length > 0 ? t("rate_filesSelected").replace("{{n}}", String(files.length)) : ""}
                </p>
              </div>
              {phase === "pending_upload" && (
                <>
                  <span id={uploadSubmitHintId} className="sr-only">
                    {t("rate_submitRequiresFiles")}
                  </span>
                  <form
                    className="inline"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submitUpload();
                    }}
                  >
                    <button
                      type="submit"
                      disabled={submitting || files.length === 0}
                      className="mt-4 rounded-[var(--radius-sm)] bg-cyan-500/80 hover:bg-cyan-500 px-4 py-2 text-white text-small font-medium disabled:opacity-50"
                      aria-busy={submitting ? true : undefined}
                      aria-describedby={files.length === 0 && !submitting ? uploadSubmitHintId : undefined}
                    >
                      {submitting ? t("common_submitting") : t("rate_submitUpload")}
                    </button>
                  </form>
                  {uploadServerSyncHint ? (
                    <p className="mt-3 text-small text-slate-300" role="status">
                      {t("rate_uploadNoApiSyncHint")}
                    </p>
                  ) : null}
                </>
              )}
            </section>
          )}

          {orderStateAllowsOffChainTextReviews(order?.state) ? (
            <section className={panelClass} aria-label={t("escrow_reviews")}>
              <p className="text-small text-slate-300 mb-3">{t("rate_reviewsSectionIntro")}</p>
              <ReviewBlock orderId={id} variantDid />
            </section>
          ) : null}

          <section className={panelClass} role="status" aria-live="polite">
            <h3 className="text-small font-semibold text-cyan-200 mb-3">{t("rate_myStatus")}</h3>
            <p className="text-small text-slate-300">
              {phase === "pending_upload" && t("rate_statePendingUpload")}
              {phase === "under_review" && t("rate_stateUnderReview")}
              {phase === "waiting_other" && t("rate_stateWaitingOther")}
              {phase === "both_confirmed" && t("rate_stateBothConfirmed")}
              {phase === "released" && t("rate_stateReleased")}
              {phase === "review_only" && t("rate_stateReviewOnly")}
            </p>
            {phase !== "review_only" ? (
              <>
                <h3 className="text-small font-semibold text-cyan-200 mt-4 mb-2">{t("rate_otherStatus")}</h3>
                <p className="text-small text-slate-300">
                  {phase === "released" && t("rate_stateReleased")}
                  {phase === "both_confirmed" && t("rate_stateBothConfirmed")}
                  {(phase === "pending_upload" || phase === "under_review" || phase === "waiting_other") &&
                    t("rate_stateWaitingOther")}
                </p>
              </>
            ) : null}
            {((phase === "under_review") ||
              (phase === "waiting_other" && orderStateAllowsConfirmRating(order?.state))) && (
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  void confirmRating();
                }}
              >
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 rounded-[var(--radius-sm)] bg-cyan-500/80 hover:bg-cyan-500 px-4 py-2 text-white text-small font-medium disabled:opacity-50"
                  aria-label={t("rate_confirmCta")}
                  aria-busy={submitting ? true : undefined}
                >
                  {submitting ? t("common_submitting") : t("rate_confirmCta")}
                </button>
              </form>
            )}
            {error && (
              <p className="mt-3 text-small text-danger" role="alert">
                {error}
              </p>
            )}
          </section>

          {phase === "both_confirmed" && (
            <section className={panelClass} aria-labelledby={rateReleaseCtaHeadingId}>
              <h2 id={rateReleaseCtaHeadingId} className="text-body font-semibold text-cyan-200 mb-2">
                {t("rate_releaseCtaTitle")}
              </h2>
              <p className="text-small text-slate-300 mb-4">{t("escrow_releaseAfterRatingHint")}</p>
              <Link
                href={`/escrow/${encodeURIComponent(id)}`}
                onClick={stashEscrowMainPrefetch}
                className="inline-flex items-center rounded-[var(--radius-sm)] bg-cyan-500/80 hover:bg-cyan-500 px-4 py-2 text-white text-small font-medium"
              >
                {t("rate_openEscrowToRelease")}
              </Link>
            </section>
          )}

          {phase === "released" && (
            <section className={panelClass} role="status" aria-live="polite">
              <p className="text-body font-semibold text-success">{t("rate_stateReleased")}</p>
              <p className="text-small text-slate-300 mt-2 mb-4">{t("rate_releaseCompleteHint")}</p>
              <Link
                href="/orders"
                className="inline-flex items-center rounded-[var(--radius-sm)] border border-slate-500 px-4 py-2 text-small text-cyan-300 hover:text-cyan-100 hover:bg-slate-800/60"
              >
                {t("escrow_backToOrders")}
              </Link>
            </section>
          )}

          <ProductCrossNav
            ariaLabelKey="rate_relatedNav_aria"
            showGuides
            className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300 pt-4 border-t border-cyan-500/20"
            linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 ${RATE_NAV_FOCUS}`}
            separatorClassName="text-slate-500"
          />
        </div>
      </div>
    </main>
  );
}

export default function EscrowRatePage() {
  return (
    <EscrowRateRouteSuspense>
      <EscrowRatePageInner />
    </EscrowRateRouteSuspense>
  );
}
