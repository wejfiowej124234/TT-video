"use client";

import { useCallback, useEffect, useState, useId, useRef, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useChainId } from "wagmi";
import {
  getDispute,
  getMe,
  getOrder,
  postDisputeResolve,
  getOrderEvidence,
  postOrderEvidence,
  getIdempotencyKey,
} from "@/lib/apiClient";
import { useDisputeExecuteResolutionIntentSigner } from "@/dapp/hooks/useDisputeExecuteResolutionIntentSigner";
import { getExpectedChainId } from "@/lib/chainEnv";
import { meRoleFromGetMe } from "@/lib/meRole";
import { mapIntentError } from "@/lib/mapIntentError";
import { mapApiReadError } from "@/lib/mapApiReadError";
import IntentSignFacts from "@/components/escrow/EscrowDetail/IntentSignFacts";
import LoadingText from "@/components/LoadingText";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { useTranslation } from "@/components/LocaleProvider";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import EvidenceSignedLinkControl from "@/components/order/EvidenceSignedLinkControl";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { DisputeDetailRouteSuspense } from "@/components/disputes/DisputeDetailRouteSuspense";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

const disputeConsoleFocus = `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;

/** GET /me 用于仲裁区与结案后链上意图区；与 string | null 角色解耦，避免失败时无限 loading */
type MeRoleFetchState =
  | { phase: "loading" }
  | { phase: "failed" }
  | { phase: "ready"; role: string | null };

/** GET 订单证据列表：与上传错误 evidenceError 分离，避免加载失败被当成「无证据」 */
type OrderEvidenceListFetch = "idle" | "loading" | "ready" | "error";

/** 区块浏览器 tx 页 base URL（13-1 表4 可追溯；与 Escrow OnchainEventTimeline 一致） */
function getExplorerTxUrl(chainId: number): string | undefined {
  if (chainId === 137) return "https://polygonscan.com/tx/";
  if (chainId === 80002) return "https://amoy.polygonscan.com/tx/";
  return undefined;
}

/** 51-F8：13-1 表4 可追溯 hash（txHash、blockNumber）必现；API 未返回时展示占位 */
type DisputeDetail = {
  id?: string;
  order_id?: string;
  status?: string;
  evidence_hashes?: string[];
  arbitrator_id?: string | null;
  refund_ratio?: number | null;
  slash_guide?: boolean | null;
  resolved_at?: string | null;
  created_at?: string;
  arb_fee_paid?: string | null;
  dispute_sequence?: number;
  resolution_tx_hash?: string | null;
  resolution_block_number?: number | string | null;
};

function DisputeDetailPageInner() {
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
  const [orderEvidence, setOrderEvidence] = useState<{ content_hash: string; created_at?: string; uploader_id?: string }[]>([]);
  const [orderEvidenceListFetch, setOrderEvidenceListFetch] = useState<OrderEvidenceListFetch>("idle");
  const [orderEvidenceListError, setOrderEvidenceListError] = useState<string | null>(null);
  const [orderEvidenceRetryKey, setOrderEvidenceRetryKey] = useState(0);
  const [evidenceHash, setEvidenceHash] = useState("");
  const [evidenceSubmitting, setEvidenceSubmitting] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [txHashCopied, setTxHashCopied] = useState(false);
  const [copyTxBusy, setCopyTxBusy] = useState(false);
  /** undefined=未拉取；null=无有效托管地址；0x…=可签 execute-resolution-intent */
  const [orderEscrowAddr, setOrderEscrowAddr] = useState<`0x${string}` | null | undefined>(undefined);
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

  const copyTxHash = useCallback(async (hash: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    setCopyTxBusy(true);
    try {
      await navigator.clipboard.writeText(hash);
      setTxHashCopied(true);
      setTimeout(() => setTxHashCopied(false), 2000);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("DisputeDetailPage copyTxHash:", err);
      }
    } finally {
      setCopyTxBusy(false);
    }
  }, []);

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
    getMe()
      .then((me) => setMeRoleFetch({ phase: "ready", role: meRoleFromGetMe(me) }))
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("DisputeDetailPage getMe:", err);
        }
        setMeRoleFetch({ phase: "failed" });
      });
  }, [meRoleRetryKey]);

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
        setOrderEvidence((Array.isArray(items) ? items : []) as { content_hash: string; created_at?: string; uploader_id?: string }[]);
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

  useEffect(() => {
    if (!dispute?.order_id || dispute.status !== "resolved") {
      setOrderEscrowAddr(undefined);
      return;
    }
    let cancelled = false;
    getOrder(dispute.order_id)
      .then((raw: unknown) => {
        if (cancelled) return;
        const res = raw as { order?: { escrow_address?: string | null } };
        const o = res?.order ?? raw;
        const addr =
          typeof o === "object" && o !== null && "escrow_address" in o
            ? (o as { escrow_address?: string | null }).escrow_address
            : null;
        const s =
          typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/i.test(addr)
            ? (addr as `0x${string}`)
            : null;
        setOrderEscrowAddr(s);
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("DisputeDetailPage getOrder escrow_address:", err);
          }
          setOrderEscrowAddr(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dispute?.order_id, dispute?.status]);

  const handleEvidenceSubmit = () => {
    const hash = evidenceHash.trim();
    if (!hash || !dispute?.order_id) return;
    setEvidenceSubmitting(true);
    setEvidenceError(null);
    postOrderEvidence(dispute.order_id, { content_hash: hash }, getIdempotencyKey())
      .then(() => {
        setEvidenceHash("");
        return getOrderEvidence(dispute!.order_id!);
      })
      .then((items) => {
        setOrderEvidence((Array.isArray(items) ? items : []) as { content_hash: string; created_at?: string; uploader_id?: string }[]);
        setOrderEvidenceListFetch("ready");
        setOrderEvidenceListError(null);
      })
      .then(() => getDispute(id).then((d) => setDispute(d as DisputeDetail)))
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
      .then(() => getDispute(id).then((d) => setDispute(d as DisputeDetail)))
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
      .then((d) => setDispute(d as DisputeDetail))
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("DisputeDetailPage handleExecuteResolutionIntent:", e);
        }
        setExecIntentError(mapIntentError(e, t, { fallbackKey: "dispute_resolveFailed" }));
      })
      .finally(() => setExecIntentSubmitting(false));
  };

  if (loading) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bg-main p-8"
        aria-label={t("dispute_detailTitle")}
      >
        <LoadingText />
        <ProductCrossNav
          ariaLabelKey="dispute_detail_relatedNav_aria"
          showGuides
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
        />
      </main>
    );
  }
  if (error) {
    return (
      <main className="min-h-screen space-y-4 bg-bg-main p-8 max-w-3xl mx-auto" aria-label={t("dispute_detailTitle")}>
        <h1 className="sr-only">{t("dispute_detailTitle")}</h1>
        <ApiErrorAlert message={error} />
        <form
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setDisputeLoadRetryKey((k) => k + 1);
          }}
        >
          <button
            type="submit"
            aria-label={t("common_retry")}
            className={`rounded-full border border-travel-500/50 bg-travel-500/10 px-4 py-2 text-meta font-medium text-travel-700 hover:text-travel-800 hover:bg-travel-500/20 motion-sub min-h-[44px] inline-flex items-center justify-center ${travelFocusRingOffset2Classes}`}
          >
            {t("common_retry")}
          </button>
        </form>
        <p>
          <Link href="/disputes" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("dispute_backList")}
          </Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="dispute_detail_relatedNav_aria"
          showGuides
        />
      </main>
    );
  }
  if (!dispute) {
    return (
      <main className="min-h-screen space-y-4 bg-bg-main p-8 max-w-3xl mx-auto" aria-label={t("dispute_detailTitle")}>
        <h1 className="sr-only">{t("dispute_notFound")}</h1>
        <p className="text-body text-ink-600">{t("dispute_notFound")}</p>
        <Link href="/disputes" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
          {t("dispute_backList")}
        </Link>
        <ProductCrossNav
          ariaLabelKey="dispute_detail_relatedNav_aria"
          showGuides
        />
      </main>
    );
  }

  const isResolved = dispute.status === "resolved";
  const sectionClass = "rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-soft border border-ink-200";

  return (
    <main className="min-h-screen bg-bg-main" aria-label={`${t("dispute_detailTitle")}${dispute.id?.slice(0, 8)}`}>
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-h4 font-semibold text-ink-900">{t("dispute_detailTitle")}{dispute.id?.slice(0, 8)}</h1>
          <span className={`text-small px-2 py-1 rounded-[var(--radius-sm)] ${isResolved ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
            {isResolved ? t("disputes_statusResolved") : t("disputes_statusPending")}
          </span>
        </div>

        <section className={sectionClass}>
          <h2 className="text-body font-semibold text-ink-800 mb-3">{t("dispute_timeline")}</h2>
          <ul className="space-y-2 text-small">
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-travel-500" />{t("dispute_createdAt")}{dispute.created_at ?? t("ui_em_dash")}</li>
            {dispute.arbitrator_id && <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-ink-400" />{t("dispute_arbAssigned")}</li>}
            {isResolved && (
              <>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" />{t("dispute_resolvedAt")}{dispute.resolved_at ?? t("ui_em_dash")}</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-ink-400" />{t("dispute_execRecord")}</li>
              </>
            )}
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-body font-semibold text-ink-800 mb-3">{t("dispute_statements")}</h2>
          <p className="text-small text-ink-600">
            {t("dispute_statementsNote")}
            {dispute.order_id ? (
              <>
                <Link
                  href={`/escrow/${encodeURIComponent(dispute.order_id)}`}
                  onClick={() => {
                    const oid = dispute.order_id;
                    if (oid) stashEscrowOrderPrefetchForOrderIdNav(oid, "escrow");
                  }}
                  className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
                >
                  #{dispute.order_id.slice(0, 8)}…
                </Link>
                {" · "}
                <Link
                  href={`/pay?orderId=${encodeURIComponent(dispute.order_id)}`}
                  onClick={() => {
                    const oid = dispute.order_id;
                    if (oid) stashEscrowOrderPrefetchForOrderIdNav(oid, "pay");
                  }}
                  className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
                >
                  {t("orders_payHub")}
                </Link>
              </>
            ) : null}
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-body font-semibold text-ink-800 mb-3">{t("dispute_evidence")}</h2>
          {dispute.order_id &&
          (orderEvidenceListFetch === "loading" || orderEvidenceListFetch === "idle") ? (
            <p className="text-meta text-ink-500 mb-4" role="status">
              {t("common_loading")}
            </p>
          ) : null}
          {dispute.order_id && orderEvidenceListFetch === "error" && orderEvidenceListError ? (
            <div className="mb-4 space-y-2">
              <p className="text-small text-danger" role="alert">
                {orderEvidenceListError}
              </p>
              <button
                type="button"
                onClick={() => setOrderEvidenceRetryKey((k) => k + 1)}
                className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              >
                {t("common_retry")}
              </button>
            </div>
          ) : null}
          {dispute.order_id && orderEvidenceListFetch === "ready" ? (
            (orderEvidence.length > 0 || (dispute.evidence_hashes && dispute.evidence_hashes.length > 0)) ? (
              <ul className="text-small font-mono space-y-2 mb-4 list-none p-0 m-0">
                {orderEvidence.map((r, i) => (
                  <li key={i} className="flex flex-wrap items-start gap-2 gap-y-1">
                    <span className="min-w-0 flex-1 text-ink-600 break-all">
                      {r.content_hash}
                      {r.created_at && <span className="text-ink-400 ml-2">{r.created_at}</span>}
                    </span>
                    {dispute.order_id ? (
                      <EvidenceSignedLinkControl orderId={dispute.order_id} contentHash={r.content_hash} variant="light" />
                    ) : null}
                  </li>
                ))}
                {dispute.evidence_hashes?.filter((h) => !orderEvidence.some((r) => r.content_hash === h)).map((h, i) => (
                  <li key={`d-${i}`} className="text-ink-600 break-all">
                    {h}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small text-ink-500 mb-4">{t("dispute_noEvidence")}</p>
            )
          ) : null}
          {!isResolved && dispute.order_id && (
            <div className="pt-3 border-t border-ink-200">
              <p className="text-small text-ink-600 mb-2">{t("dispute_uploadEvidence")}</p>
              <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEvidenceSubmit();
                }}
              >
                <input type="text" value={evidenceHash} onChange={(e) => setEvidenceHash(e.target.value)} placeholder={t("dispute_evidencePlaceholder")} className={`min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-1.5 text-small font-mono w-64 max-w-full bg-bg-console ${disputeConsoleFocus}`} />
                <button type="submit" disabled={evidenceSubmitting || !evidenceHash.trim()} aria-busy={evidenceSubmitting ? true : undefined} className="btn-console rounded-[var(--radius-sm)] bg-trust-600 px-3 py-1.5 text-white text-small disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console">{evidenceSubmitting ? t("dispute_uploading") : t("dispute_upload")}</button>
              </form>
              {evidenceError && <p className="text-small text-danger mt-1">{evidenceError}</p>}
            </div>
          )}
        </section>

        {isResolved && (
          <section className={sectionClass}>
            <h2 className="text-body font-semibold text-ink-800 mb-3">{t("dispute_result")}</h2>
            <ul className="text-small space-y-1 text-ink-700">
              <li>{t("dispute_refundRatio")}{dispute.refund_ratio != null ? `${(dispute.refund_ratio * 100).toFixed(0)}%` : t("ui_em_dash")}</li>
              <li>{t("dispute_slashGuide")}{dispute.slash_guide ? t("dispute_yes") : t("dispute_no")}</li>
              <li>{t("dispute_resolvedAt")}{dispute.resolved_at ?? t("ui_em_dash")}</li>
            </ul>
          </section>
        )}

        {isResolved && (
          <section className={sectionClass}>
            <h2 className="text-body font-semibold text-ink-800 mb-3">{t("dispute_execSection")}</h2>
            <p className="text-small text-ink-600">{t("dispute_execNote")}</p>
            {dispute.order_id && orderEscrowAddr === undefined && (
              <p className="text-meta text-ink-500 mt-3">{t("common_loading")}</p>
            )}
            {orderEscrowAddr === null && (
              <p className="text-small text-ink-600 mt-3">{t("dispute_executeIntentNoEscrow")}</p>
            )}
            {orderEscrowAddr && !dispute.resolution_tx_hash && (
              meRoleFetch.phase === "loading" ? (
                <p className="text-meta text-ink-500 mt-3">{t("common_loading")}</p>
              ) : meRoleFetch.phase === "failed" ? (
                <div className="mt-3 space-y-2">
                  <ApiErrorAlert message={t("dispute_meRoleLoadFailed")} />
                  <form
                    className="inline"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setMeRoleRetryKey((k) => k + 1);
                    }}
                  >
                    <button
                      type="submit"
                      className={`btn-console rounded-[var(--radius-sm)] border border-ink-300 bg-bg-console px-3 py-1.5 text-small text-ink-700 hover:bg-ink-50 ${disputeConsoleFocus}`}
                    >
                      {t("common_retry")}
                    </button>
                  </form>
                </div>
              ) : meRoleFetch.role !== null && meRoleFetch.role !== "arbitrator" ? (
                <p className="text-small text-ink-700 mt-3" role="status">{t("dispute_executeIntentArbitratorOnly")}</p>
              ) : (
                <div className="mt-4 pt-4 border-t border-ink-200 space-y-2">
                  <h3 className="text-small font-semibold text-ink-800">{t("dispute_executeIntentTitle")}</h3>
                  {dispute.order_id ? (
                    <IntentSignFacts
                      orderId={dispute.order_id}
                      expectedChainId={expectedChainId}
                      escrowAddress={orderEscrowAddr}
                      action="execute_resolution"
                      disputeId={id}
                    />
                  ) : null}
                  <p className="text-meta text-ink-600">{t("dispute_executeIntentHint")}</p>
                  <p className="text-meta text-ink-500">{t("dispute_executeIntentNoTxHint")}</p>
                  {execIntentError && (
                    <p className="text-small text-danger" role="alert">{execIntentError}</p>
                  )}
                  {execIntentOk && (
                    <p className="text-small text-success" role="status">{t("escrow_intentAccepted")}</p>
                  )}
                  <form
                    className="inline"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleExecuteResolutionIntent();
                    }}
                  >
                    <button
                      type="submit"
                      disabled={
                        execIntentSubmitting ||
                        isSigning ||
                        !walletConnected ||
                        chainMismatch
                      }
                      aria-busy={execIntentSubmitting || isSigning ? true : undefined}
                      className="btn-console rounded-[var(--radius-sm)] bg-travel-600 px-4 py-2 text-white text-small disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console"
                    >
                      {execIntentSubmitting || isSigning ? t("common_submitting") : t("dispute_executeIntentTitle")}
                    </button>
                  </form>
                  {!walletConnected && (
                    <p className="text-meta text-ink-500">{t("escrow_intentConnectWallet")}</p>
                  )}
                  {walletConnected && chainMismatch && (
                    <p className="text-meta text-warning">{t("escrow_intentWrongChain")}</p>
                  )}
                </div>
              )
            )}
          </section>
        )}

        {isResolved && (
          <section className={sectionClass} aria-labelledby={disputeTraceableHeadingId}>
            <h2 id={disputeTraceableHeadingId} className="text-body font-semibold text-ink-800 mb-3">{t("dispute_traceableSection")}</h2>
            <dl className="text-small font-mono space-y-2 text-ink-700">
              {dispute.resolution_tx_hash ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <dt className="inline font-medium text-ink-600 shrink-0">{t("dispute_txHashLabel")}</dt>
                    <dd className="inline break-all min-w-0">{dispute.resolution_tx_hash}</dd>
                    <span className="flex gap-1 shrink-0">
                      <form
                        className="inline"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void copyTxHash(dispute.resolution_tx_hash!);
                        }}
                      >
                        <button
                          type="submit"
                          disabled={copyTxBusy}
                          aria-busy={copyTxBusy ? true : undefined}
                          className={`rounded-[var(--radius-sm)] border border-ink-200 px-2 py-0.5 text-meta text-ink-600 hover:bg-ink-50 disabled:opacity-60 disabled:cursor-wait ${disputeConsoleFocus}`}
                          aria-label={t("dispute_copyTxHash")}
                        >
                          {txHashCopied ? t("dispute_txHashCopied") : t("dispute_copyTxHash")}
                        </button>
                      </form>
                      {explorerTxUrl && (
                        <a
                          href={`${explorerTxUrl}${dispute.resolution_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-200 px-2 py-0.5 text-meta text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                        >
                          {t("escrow_viewTx")}
                        </a>
                      )}
                    </span>
                  </div>
                  {dispute.resolution_block_number != null && (
                    <div><dt className="inline font-medium text-ink-600">{t("dispute_blockNumberLabel")}</dt><dd className="inline ml-2">{String(dispute.resolution_block_number)}</dd></div>
                  )}
                </>
              ) : (
                <p className="text-ink-500">{t("dispute_traceablePending")}</p>
              )}
            </dl>
          </section>
        )}

        {!isResolved && meRoleFetch.phase === "loading" && (
          <section className={sectionClass}>
            <h2 className="text-body font-semibold text-ink-800 mb-2">{t("dispute_arbSection")}</h2>
            <p className="text-meta text-ink-500">{t("common_loading")}</p>
          </section>
        )}
        {!isResolved && meRoleFetch.phase === "failed" && (
          <section className={sectionClass}>
            <h2 className="text-body font-semibold text-ink-800 mb-2">{t("dispute_arbSection")}</h2>
            <div className="space-y-2">
              <ApiErrorAlert message={t("dispute_meRoleLoadFailed")} />
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  setMeRoleRetryKey((k) => k + 1);
                }}
              >
                <button
                  type="submit"
                  className={`btn-console rounded-[var(--radius-sm)] border border-ink-300 bg-bg-console px-3 py-1.5 text-small text-ink-700 hover:bg-ink-50 ${disputeConsoleFocus}`}
                >
                  {t("common_retry")}
                </button>
              </form>
            </div>
          </section>
        )}
        {!isResolved && meRoleFetch.phase === "ready" && meRoleFetch.role !== null && meRoleFetch.role !== "arbitrator" && (
          <section className="rounded-[var(--radius-sm)] bg-ink-50 border border-ink-200 p-6">
            <h2 className="text-body font-semibold text-ink-900 mb-2">{t("dispute_arbSection")}</h2>
            <p className="text-small text-ink-700">{t("dispute_resolveArbitratorOnly")}</p>
          </section>
        )}
        {!isResolved && meRoleFetch.phase === "ready" && (meRoleFetch.role === null || meRoleFetch.role === "arbitrator") && (
          <section className="rounded-[var(--radius-sm)] bg-warning/10 border border-warning/30 p-6">
            <h2 className="text-body font-semibold text-ink-900 mb-3">{t("dispute_arbSection")}</h2>
            <p className="text-small text-ink-700 mb-3">{t("dispute_arbNote")}</p>
            <form
              className="space-y-3 max-w-xs"
              onSubmit={(e) => {
                e.preventDefault();
                handleResolve();
              }}
            >
              <label className="block text-small font-medium text-ink-700">
                {t("dispute_refundLabel")}
                <input type="number" min="0" max="1" step="0.01" value={refundRatio} onChange={(e) => setRefundRatio(e.target.value)} className={`mt-1 block w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1 bg-bg-console ${disputeConsoleFocus}`} />
              </label>
              <label className="flex items-center gap-2 text-small text-ink-700">
                <input type="checkbox" checked={slashGuide} onChange={(e) => setSlashGuide(e.target.checked)} className={`rounded-[var(--radius-sm)] border border-ink-300 text-travel-500 ${disputeConsoleFocus}`} />{t("dispute_slashLabel")}
              </label>
              {resolveError && <p className="text-small text-danger">{resolveError}</p>}
              <button type="submit" disabled={resolveSubmitting} aria-busy={resolveSubmitting ? true : undefined} className="btn-console rounded-[var(--radius-sm)] bg-warning px-4 py-2 text-white text-small disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console">{resolveSubmitting ? t("dispute_uploading") : t("dispute_submitResolve")}</button>
            </form>
          </section>
        )}

        <p className="text-meta text-ink-500">
          <Link
            href="/disputes"
            className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("dispute_backList")}
          </Link>
          {" · "}
          <Link
            href="/orders"
            className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("disputes_navOrders")}
          </Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="dispute_detail_relatedNav_aria"
          showGuides
        />
      </div>
    </main>
  );
}

export default function DisputeDetailPageClient() {
  return (
    <DisputeDetailRouteSuspense>
      <DisputeDetailPageInner />
    </DisputeDetailRouteSuspense>
  );
}
