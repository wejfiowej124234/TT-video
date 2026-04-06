"use client";

import { normalizeChainSyncReadStatus, type OrderChainSyncState } from "./types";

function escrowAbsentSnapshotMessage(reason: string, t: (key: string) => string): string {
  switch (reason) {
    case "no_database":
      return t("escrow_chainSnapshot_absent_no_database");
    case "no_chain_context":
      return t("escrow_chainSnapshot_absent_no_chain_context");
    case "no_row":
      return t("escrow_chainSnapshot_absent_no_row");
    case "read_failed":
      return t("escrow_chainSnapshot_absent_read_failed");
    case "projection_backend_unavailable":
      return t("escrow_chainSnapshot_absent_projection_backend_unavailable");
    default:
      return t("escrow_chainSnapshot_absent_unknown").replace("{{reason}}", reason);
  }
}

export interface ChainSyncStatusPanelProps {
  chainSync: OrderChainSyncState;
  t: (key: string) => string;
  variant?: "dark" | "light";
}

export default function ChainSyncStatusPanel({
  chainSync,
  t,
  variant = "dark",
}: ChainSyncStatusPanelProps) {
  const textMuted = variant === "dark" ? "text-slate-300" : "text-ink-600";
  const textMeta = variant === "dark" ? "text-meta text-slate-200" : "text-meta text-slate-700";
  const border = variant === "dark" ? "border-slate-600/50 bg-slate-900/40" : "border-slate-200 bg-slate-50";

  const snap = chainSync.eventLogSnapshot;
  const absent = chainSync.eventLogSnapshotAbsentReason;
  const apiNote = chainSync.chainSyncNote;
  const orderIdEcho = chainSync.chainSyncOrderId;
  const requesterEcho = chainSync.chainSyncRequester;
  const lastEv = chainSync.lastEvent;
  const readSt = normalizeChainSyncReadStatus(chainSync.syncStatus);
  const syncStatusReadable =
    readSt === "pending"
      ? t("escrow_chainSync_syncStatus_pending")
      : readSt === "confirmed"
        ? t("escrow_chainSync_syncStatus_confirmed")
        : t("escrow_chainSync_syncStatus_unknown");

  const summaryClass =
    readSt === "pending"
      ? variant === "dark"
        ? "text-small text-amber-200/95 leading-relaxed"
        : "text-small text-amber-900 leading-relaxed"
      : readSt === "confirmed"
        ? variant === "dark"
          ? "text-small text-emerald-200/90 leading-relaxed"
          : "text-small text-emerald-900 leading-relaxed"
        : variant === "dark"
          ? "text-small text-slate-300 leading-relaxed"
          : "text-small text-ink-700 leading-relaxed";

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 ${border}`}
      role="region"
      aria-label={t("escrow_chainSync_title")}
    >
      <p className={`text-small font-medium ${textMuted}`}>{t("escrow_chainSync_title")}</p>
      <p className={summaryClass} role="status">
        {readSt === "pending"
          ? t("escrow_chainSync_summaryPending")
          : readSt === "confirmed"
            ? t("escrow_chainSync_summaryConfirmed")
            : t("escrow_chainSync_summaryUnknown")}
      </p>
      {orderIdEcho ? (
        <p className={`font-mono break-all ${textMeta}`}>
          {t("escrow_chainSync_orderIdEcho").replace("{{id}}", orderIdEcho)}
        </p>
      ) : null}
      {requesterEcho ? (
        <p className={`font-mono break-all ${textMeta}`}>
          {t("escrow_chainSync_requesterEcho").replace("{{id}}", requesterEcho)}
        </p>
      ) : null}
      <p className={textMeta}>
        {t("escrow_chainSync_syncStatus").replace("{{s}}", syncStatusReadable)}
      </p>
      <p className={textMeta}>
        {t("escrow_chainSync_finalityN").replace("{{n}}", String(chainSync.finalityN))}
      </p>
      <p className={textMeta}>
        {t("escrow_chainSync_checkpoint")
          .replace("{{block}}", String(chainSync.checkpointBlock))
          .replace("{{log}}", String(chainSync.checkpointLog))}
      </p>
      {chainSync.checkpointSource ? (
        <p className={textMeta}>
          {t("escrow_chainSync_checkpointSource").replace("{{s}}", chainSync.checkpointSource)}
        </p>
      ) : null}
      {lastEv ? (
        <div className={`pt-1 border-t ${variant === "dark" ? "border-slate-600/40" : "border-slate-200"} space-y-1`}>
          <p className={`text-small ${textMuted}`}>{t("escrow_chainSync_lastEvent_title")}</p>
          <p className={textMeta}>
            {t("escrow_chainSync_lastEvent_state").replace("{{state}}", lastEv.state)}
          </p>
          <p className={`font-mono ${textMeta}`}>
            {t("escrow_chainSync_lastEvent_updatedAt").replace("{{at}}", lastEv.updated_at)}
          </p>
          {lastEv.escrow_address ? (
            <p className={`font-mono break-all ${textMeta}`}>
              {t("escrow_chainSync_lastEvent_escrow").replace("{{addr}}", lastEv.escrow_address)}
            </p>
          ) : (
            <p className={textMeta}>{t("escrow_chainSync_lastEvent_noEscrow")}</p>
          )}
        </div>
      ) : null}
      {apiNote ? (
        <p className={`text-small ${textMeta}`}>
          {t("escrow_chainSync_runtimeNote").replace("{{text}}", apiNote)}
        </p>
      ) : null}
      {snap ? (
        <div className={`pt-1 border-t ${variant === "dark" ? "border-slate-600/40" : "border-slate-200"} space-y-1`}>
          <p className={`text-small ${textMuted}`}>{t("escrow_chainSync_eventSnapshot")}</p>
          <p className={`font-mono ${textMeta}`}>
            {t("escrow_chainSnapshot_finalityUsed").replace("{{n}}", String(snap.finality_n_used))}
          </p>
          <p className={`font-mono ${textMeta}`}>
            {t("escrow_chainSnapshot_blockLog")
              .replace("{{block}}", String(snap.block_number))
              .replace("{{log}}", String(snap.log_index))}
          </p>
          <p className={`font-mono ${textMeta}`}>
            {t("escrow_chainSnapshot_eventType").replace("{{type}}", snap.event_type)}
          </p>
          {snap.tx_hash ? (
            <p className={`font-mono break-all ${textMeta}`}>
              {t("escrow_chainSnapshot_txHash").replace("{{h}}", snap.tx_hash)}
            </p>
          ) : null}
          {snap.block_hash ? (
            <p className={`font-mono break-all ${textMeta}`}>
              {t("escrow_chainSnapshot_blockHash").replace("{{h}}", snap.block_hash)}
            </p>
          ) : null}
        </div>
      ) : absent ? (
        <div className={`pt-1 border-t ${variant === "dark" ? "border-slate-600/40" : "border-slate-200"}`}>
          <p className={`text-small ${textMuted}`}>{t("escrow_chainSync_eventSnapshot")}</p>
          <p className={textMeta}>{escrowAbsentSnapshotMessage(absent, t)}</p>
        </div>
      ) : null}
    </div>
  );
}
