"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useChainId } from "wagmi";
import { getDispute, getMeFull, postDisputeResolve, getIdempotencyKey } from "@/lib/apiClient";
import { useDisputeExecuteResolutionIntentSigner } from "@/dapp/hooks/useDisputeExecuteResolutionIntentSigner";
import { getExpectedChainId } from "@/lib/chainEnv";
import { meRoleFromGetMe } from "@/lib/meRole";
import { mapIntentError } from "@/lib/mapIntentError";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { apiDisputeSliceMatchesRoute } from "@/lib/disputeGetEnvelopeGuard";
import { useTranslation } from "@/components/LocaleProvider";
import type { DisputeDetail, MeRoleFetchState, OrderEvidenceListFetch, OrderEvidenceRow } from "./disputeDetailPageTypes";
import { getExplorerTxUrl } from "./disputeDetailPageTypes";
import { useDisputeDetailPageCopyTx } from "./useDisputeDetailPageCopyTx";
import { useDisputeDetailPageOrderEvidence } from "./useDisputeDetailPageOrderEvidence";
import { useDisputeDetailPageResolvedOrderEscrow } from "./useDisputeDetailPageResolvedOrderEscrow";

export type DisputeDetailPageModel = {
  t: (key: string) => string;
  id: string;
  dispute: DisputeDetail | null;
  loading: boolean;
  error: string | null;
  onDisputeLoadRetry: () => void;
  resolveSubmitting: boolean;
  resolveError: string | null;
  refundRatio: string;
  setRefundRatio: (v: string) => void;
  slashGuide: boolean;
  setSlashGuide: (v: boolean) => void;
  orderEvidence: OrderEvidenceRow[];
  orderEvidenceListFetch: OrderEvidenceListFetch;
  orderEvidenceListError: string | null;
  onOrderEvidenceRetry: () => void;
  evidenceHash: string;
  setEvidenceHash: (v: string) => void;
  evidenceSubmitting: boolean;
  evidenceError: string | null;
  handleEvidenceSubmit: () => void;
  txHashCopied: boolean;
  copyTxBusy: boolean;
  copyTxHash: (hash: string) => Promise<void>;
  orderEscrowAddr: `0x${string}` | null | undefined;
  orderEscrowEnvelopeMismatch: boolean;
  execIntentError: string | null;
  execIntentOk: boolean;
  execIntentSubmitting: boolean;
  handleExecuteResolutionIntent: () => void;
  meRoleFetch: MeRoleFetchState;
  onMeRoleRetry: () => void;
  chainId: number;
  explorerTxUrl: string | undefined;
  expectedChainId: number;
  walletConnected: boolean;
  chainMismatch: boolean;
  isSigning: boolean;
  handleResolve: () => void;
  disputeTraceableHeadingId: string;
  disputeEvidenceHashInputId: string;
  disputeRefundRatioInputId: string;
};

export function useDisputeDetailPage(): DisputeDetailPageModel {
  const { t } = useTranslation();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [refundRatio, setRefundRatio] = useState("1");
  const [slashGuide, setSlashGuide] = useState(false);
  const [execIntentError, setExecIntentError] = useState<string | null>(null);
  const [execIntentOk, setExecIntentOk] = useState(false);
  const [execIntentSubmitting, setExecIntentSubmitting] = useState(false);
  const [meRoleFetch, setMeRoleFetch] = useState<MeRoleFetchState>({ phase: "loading" });
  const [meRoleRetryKey, setMeRoleRetryKey] = useState(0);
  const [disputeLoadRetryKey, setDisputeLoadRetryKey] = useState(0);
  const disputeFetchGen = useRef(0);
  const chainId = useChainId();
  const explorerTxUrl = getExplorerTxUrl(chainId);
  const expectedChainId = getExpectedChainId();
  const {
    isConnected: walletConnected,
    chainMismatch,
    isSigning,
    submitExecuteResolutionIntent,
  } = useDisputeExecuteResolutionIntentSigner(expectedChainId);
  const disputeTraceableHeadingId = useId();
  const disputeEvidenceHashInputId = useId();
  const disputeRefundRatioInputId = useId();

  const { txHashCopied, copyTxBusy, copyTxHash } = useDisputeDetailPageCopyTx();
  const {
    orderEvidence,
    orderEvidenceListFetch,
    orderEvidenceListError,
    onOrderEvidenceRetry,
    evidenceHash,
    setEvidenceHash,
    evidenceSubmitting,
    evidenceError,
    handleEvidenceSubmit,
  } = useDisputeDetailPageOrderEvidence({ id, dispute, setDispute, t });
  const { orderEscrowAddr, orderEscrowEnvelopeMismatch } = useDisputeDetailPageResolvedOrderEscrow(dispute);

  useEffect(() => {
    const gen = ++disputeFetchGen.current;
    if (!id) {
      setLoading(false);
      setDispute(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getDispute(id)
      .then((d) => {
        if (gen !== disputeFetchGen.current) return;
        if (!apiDisputeSliceMatchesRoute(d, id)) {
          setDispute(null);
          setError(t("disputeGet_payloadMismatch"));
          return;
        }
        setError(null);
        setDispute(d as DisputeDetail);
      })
      .catch((e) => {
        if (gen !== disputeFetchGen.current) return;
        if (typeof window !== "undefined") {
          console.error("DisputeDetailPage load:", e);
        }
        setError(mapApiReadError(e, t, "dispute_loadFailed"));
      })
      .finally(() => {
        if (gen !== disputeFetchGen.current) return;
        setLoading(false);
      });
  }, [id, t, disputeLoadRetryKey]);

  useEffect(() => {
    setMeRoleFetch({ phase: "loading" });
    getMeFull({ force: true })
      .then((me) => setMeRoleFetch({ phase: "ready", role: meRoleFromGetMe(me) }))
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("DisputeDetailPage getMeFull:", err);
        }
        setMeRoleFetch({ phase: "failed" });
      });
  }, [meRoleRetryKey]);

  const handleResolve = () => {
    if (!id || dispute?.status === "resolved") return;
    const ratio = parseFloat(refundRatio);
    if (Number.isNaN(ratio) || ratio < 0 || ratio > 1) {
      setResolveError(t("dispute_refundRangeError"));
      return;
    }
    setResolveSubmitting(true);
    setResolveError(null);
    postDisputeResolve(id, { refund_ratio: ratio, slash_guide: slashGuide }, getIdempotencyKey())
      .then(() =>
        getDispute(id).then((d) => {
          if (!apiDisputeSliceMatchesRoute(d, id)) return;
          setDispute(d as DisputeDetail);
        })
      )
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("DisputeDetailPage handleResolve:", e);
        }
        const code = e instanceof Error ? e.message : "";
        if (code === "only_arbitrator_can_resolve") setResolveError(t("dispute_onlyArbitratorCanResolve"));
        else setResolveError(mapApiReadError(e, t, "dispute_resolveFailed"));
      })
      .finally(() => setResolveSubmitting(false));
  };

  const handleExecuteResolutionIntent = () => {
    if (!id || !dispute?.order_id || !orderEscrowAddr || dispute.resolution_tx_hash) return;
    setExecIntentSubmitting(true);
    setExecIntentError(null);
    setExecIntentOk(false);
    submitExecuteResolutionIntent(id, dispute.order_id, orderEscrowAddr)
      .then(() => {
        setExecIntentOk(true);
        return getDispute(id);
      })
      .then((d) => {
        if (!apiDisputeSliceMatchesRoute(d, id)) return;
        setDispute(d as DisputeDetail);
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("DisputeDetailPage handleExecuteResolutionIntent:", e);
        }
        setExecIntentError(mapIntentError(e, t, { fallbackKey: "dispute_resolveFailed" }));
      })
      .finally(() => setExecIntentSubmitting(false));
  };

  return {
    t,
    id,
    dispute,
    loading,
    error,
    onDisputeLoadRetry: () => setDisputeLoadRetryKey((k) => k + 1),
    resolveSubmitting,
    resolveError,
    refundRatio,
    setRefundRatio,
    slashGuide,
    setSlashGuide,
    orderEvidence,
    orderEvidenceListFetch,
    orderEvidenceListError,
    onOrderEvidenceRetry,
    evidenceHash,
    setEvidenceHash,
    evidenceSubmitting,
    evidenceError,
    handleEvidenceSubmit,
    txHashCopied,
    copyTxBusy,
    copyTxHash,
    orderEscrowAddr,
    orderEscrowEnvelopeMismatch,
    execIntentError,
    execIntentOk,
    execIntentSubmitting,
    handleExecuteResolutionIntent,
    meRoleFetch,
    onMeRoleRetry: () => setMeRoleRetryKey((k) => k + 1),
    chainId,
    explorerTxUrl,
    expectedChainId,
    walletConnected,
    chainMismatch,
    isSigning,
    handleResolve,
    disputeTraceableHeadingId,
    disputeEvidenceHashInputId,
    disputeRefundRatioInputId,
  };
}
