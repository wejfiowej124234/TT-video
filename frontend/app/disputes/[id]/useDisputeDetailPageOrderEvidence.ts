"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import {
  getDispute,
  getOrderEvidence,
  postOrderEvidence,
  getIdempotencyKey,
} from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { apiDisputeSliceMatchesRoute } from "@/lib/disputeGetEnvelopeGuard";
import type { DisputeDetail, OrderEvidenceListFetch, OrderEvidenceRow } from "./disputeDetailPageTypes";

type Translate = (key: string) => string;

export function useDisputeDetailPageOrderEvidence(opts: {
  id: string;
  dispute: DisputeDetail | null;
  setDispute: Dispatch<SetStateAction<DisputeDetail | null>>;
  t: Translate;
}) {
  const { id, dispute, setDispute, t } = opts;
  const [orderEvidence, setOrderEvidence] = useState<OrderEvidenceRow[]>([]);
  const [orderEvidenceListFetch, setOrderEvidenceListFetch] = useState<OrderEvidenceListFetch>("idle");
  const [orderEvidenceListError, setOrderEvidenceListError] = useState<string | null>(null);
  const [orderEvidenceRetryKey, setOrderEvidenceRetryKey] = useState(0);
  const [evidenceHash, setEvidenceHash] = useState("");
  const [evidenceSubmitting, setEvidenceSubmitting] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  useEffect(() => {
    if (!dispute?.order_id) {
      setOrderEvidence([]);
      setOrderEvidenceListFetch("idle");
      setOrderEvidenceListError(null);
      return;
    }
    let cancelled = false;
    setOrderEvidenceListFetch("loading");
    setOrderEvidenceListError(null);
    setOrderEvidence([]);
    getOrderEvidence(dispute.order_id)
      .then((items) => {
        if (cancelled) return;
        setOrderEvidence((Array.isArray(items) ? items : []) as OrderEvidenceRow[]);
        setOrderEvidenceListFetch("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("DisputeDetailPage getOrderEvidence:", err);
        }
        setOrderEvidence([]);
        setOrderEvidenceListError(mapApiReadError(err, t, "dispute_orderEvidenceListFailed"));
        setOrderEvidenceListFetch("error");
      });
    return () => {
      cancelled = true;
    };
  }, [dispute?.order_id, orderEvidenceRetryKey, t]);

  const handleEvidenceSubmit = () => {
    const hash = evidenceHash.trim();
    const orderId = dispute?.order_id;
    if (!hash || !orderId) return;
    setEvidenceSubmitting(true);
    setEvidenceError(null);
    postOrderEvidence(orderId, { content_hash: hash }, getIdempotencyKey())
      .then(() => {
        setEvidenceHash("");
        return getOrderEvidence(orderId);
      })
      .then((items) => {
        setOrderEvidence((Array.isArray(items) ? items : []) as OrderEvidenceRow[]);
        setOrderEvidenceListFetch("ready");
        setOrderEvidenceListError(null);
      })
      .then(() =>
        getDispute(id).then((d) => {
          if (!apiDisputeSliceMatchesRoute(d, id)) return;
          setDispute(d as DisputeDetail);
        })
      )
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("DisputeDetailPage handleEvidenceSubmit:", e);
        }
        const code = e instanceof Error ? e.message : "";
        if (code === "evidence_db_persist_failed") setEvidenceError(t("dispute_evidenceDbUnavailable"));
        else setEvidenceError(mapApiReadError(e, t, "dispute_uploadFailed"));
      })
      .finally(() => setEvidenceSubmitting(false));
  };

  return {
    orderEvidence,
    orderEvidenceListFetch,
    orderEvidenceListError,
    onOrderEvidenceRetry: () => setOrderEvidenceRetryKey((k) => k + 1),
    evidenceHash,
    setEvidenceHash,
    evidenceSubmitting,
    evidenceError,
    handleEvidenceSubmit,
  };
}
