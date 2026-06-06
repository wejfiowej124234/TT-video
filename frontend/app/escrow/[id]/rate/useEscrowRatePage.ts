import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import type { OrderResponse } from "@/components/escrow/EscrowDetail/types";
import { getOrder, getIdempotencyKey, orderConfirmRating } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { stashEscrowOrderPrefetchForRatingPageMainNav } from "@/lib/orderEscrowPrefetch";

import {
  normalizeGetOrderPayload,
  orderStateAllowsConfirmRating,
  orderStateAllowsOffChainTextReviews,
  type RatingPhase,
} from "./escrowRatePageModel";

export type UseEscrowRatePageResult = {
  t: ReturnType<typeof useTranslation>["t"];
  id: string;
  order: {
    state?: string;
    sub_status?: string;
    rating_deadline?: string | null;
  } | null;
  loading: boolean;
  orderLoadError: string | null;
  phase: RatingPhase;
  files: File[];
  submitting: boolean;
  error: string | null;
  uploadServerSyncHint: boolean;
  uploadSubmitHintId: string;
  ratePageH1Id: string;
  rateUploadHeadingId: string;
  rateFileInputId: string;
  rateFileHintId: string;
  rateReleaseCtaHeadingId: string;
  loadOrder: (refreshOnly?: boolean) => Promise<void>;
  stashEscrowMainPrefetch: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  submitUpload: () => void;
  confirmRating: () => Promise<void>;
};

export function useEscrowRatePage(orderId: string): UseEscrowRatePageResult {
  const id = orderId.trim();
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

  return {
    t,
    id,
    order,
    loading,
    orderLoadError,
    phase,
    files,
    submitting,
    error,
    uploadServerSyncHint,
    uploadSubmitHintId,
    ratePageH1Id,
    rateUploadHeadingId,
    rateFileInputId,
    rateFileHintId,
    rateReleaseCtaHeadingId,
    loadOrder,
    stashEscrowMainPrefetch,
    onFileChange,
    submitUpload,
    confirmRating,
  };
}
