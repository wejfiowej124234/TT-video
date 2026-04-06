"use client";

import { useTranslation } from "@/components/LocaleProvider";

/**
 * 终局状态标识（28 §8.3 Console 组件）
 * 展示 finality 块高或「已终局 N 块」；无块高时占位提示。
 */
export interface FinalityBadgeProps {
  /** 终态确认块高（索引后） */
  finalityBlock?: number | null;
  /** 托管创建/当前块高（无 finalityBlock 时备用） */
  escrowBlockNumber?: number | null;
  /** 终态确认块数（规范 06，默认 12） */
  confirmBlocks?: number;
  /** 创建时间（可选） */
  createdAt?: string | null;
  /** 标签文案覆盖；不传则用 i18n 默认 */
  labelFinality?: string;
  labelConfirmBlocks?: string;
  /** 深色背景（如 escrow 页）时使用浅色字以保证可读性 */
  variant?: "light" | "dark";
  /**
   * B-038：`GET …/chain-sync-status` 的 `chain_sync.status`（pending|confirmed|unknown）。
   * 有块高但无 finalityBlock 且为 pending 时，禁止用「终态块高」口吻。
   */
  readModelSyncStatus?: "pending" | "confirmed" | "unknown" | null;
}

const DEFAULT_CONFIRM_BLOCKS = 12;

/** 53 §4.6.10 SC10：时间可读格式（YYYY-MM-DD HH:mm 或用户时区） */
function formatCreatedAt(createdAt: string | null | undefined): string {
  if (!createdAt) return "";
  try {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return createdAt;
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  } catch {
    return createdAt;
  }
}

export default function FinalityBadge({
  finalityBlock,
  escrowBlockNumber,
  confirmBlocks = DEFAULT_CONFIRM_BLOCKS,
  createdAt,
  labelFinality: labelFinalityProp,
  labelConfirmBlocks: labelConfirmBlocksProp,
  variant = "light",
  readModelSyncStatus = null,
}: FinalityBadgeProps) {
  const { t } = useTranslation();
  const labelFinality = labelFinalityProp ?? t("escrow_finality_label");
  const labelConfirmBlocks = labelConfirmBlocksProp ?? t("escrow_finality_confirmBlocks");
  const hasBlock =
    finalityBlock != null ||
    escrowBlockNumber != null;
  const waitingText = t("escrow_finality_waiting");
  const confirmNote = t("escrow_finality_confirmNote").replace("{{n}}", String(confirmBlocks));
  const confirmPendingNote = t("escrow_finality_confirmPendingNote").replace("{{n}}", String(confirmBlocks));
  const createdAtFormatted = formatCreatedAt(createdAt);
  const rm = readModelSyncStatus ?? null;

  const c = variant === "dark"
    ? { label: "text-slate-300", primary: "text-slate-200", secondary: "text-slate-300" }
    : { label: "text-ink-500", primary: "text-ink-700", secondary: "text-ink-500" };

  let blockPrimaryLine: string;
  if (finalityBlock != null) {
    blockPrimaryLine = t("escrow_finality_blockHeight").replace("{{n}}", String(finalityBlock));
  } else if (escrowBlockNumber != null) {
    blockPrimaryLine =
      rm === "confirmed"
        ? t("escrow_finality_indexerConfirmedAtBlock").replace("{{n}}", String(escrowBlockNumber))
        : t("escrow_finality_provisionalBlock").replace("{{n}}", String(escrowBlockNumber));
  } else {
    blockPrimaryLine = waitingText;
  }

  const treatAsFinalizedForRule = finalityBlock != null || rm === "confirmed";
  const secondaryNote = `${labelConfirmBlocks}：${confirmBlocks} ${
    treatAsFinalizedForRule ? confirmNote : confirmPendingNote
  }`;

  return (
    <div>
      <p className={`text-small ${c.label}`}>{labelFinality}</p>
      {createdAtFormatted && (
        <p className={`text-small ${c.primary} mt-0.5`}>{t("escrow_finality_createdAt")}{createdAtFormatted}</p>
      )}
      {hasBlock ? (
        <>
          <p className={`text-small ${c.primary} mt-1`}>
            {blockPrimaryLine}
          </p>
          {rm === "unknown" && escrowBlockNumber != null && finalityBlock == null ? (
            <p className={`text-meta ${c.secondary} mt-0.5`} role="status">
              {t("escrow_finality_readModelUnknownNote")}
            </p>
          ) : null}
          <p className={`text-meta ${c.secondary} mt-0.5`}>
            {secondaryNote}
          </p>
        </>
      ) : (
        <p className={`text-small ${c.primary} mt-1`}>
          {waitingText}
        </p>
      )}
    </div>
  );
}
