"use client";

import { useTranslation } from "@/components/LocaleProvider";

/**
 * 交易状态机展示（28 §8.3 Console 组件）
 * 用于签名弹窗内「交易状态」一行；可复用。
 */
export type TxMachineState = "idle" | "pending" | "success" | "failed";

export interface TxMachineStatusProps {
  pending: boolean;
  success: boolean;
  failed: boolean;
  /** 订单协议区深色底 */
  variantDid?: boolean;
  /** 是否处于「等待签名」阶段（已打开弹窗但未点确认） */
  signing?: boolean;
  /** 自定义文案；不传则用 i18n 默认 */
  labels?: {
    idle?: string;
    signing?: string;
    pending?: string;
    success?: string;
    failed?: string;
  };
  /** 前缀，不传则用 i18n 默认 */
  prefix?: string;
  /** 是否使用长标题 */
  longPrefix?: boolean;
}

export default function TxMachineStatus({
  pending,
  success,
  failed,
  variantDid,
  signing = false,
  labels = {},
  prefix: prefixProp,
  longPrefix = false,
}: TxMachineStatusProps) {
  const { t } = useTranslation();
  const defaultLabels = {
    idle: t("escrow_txStatus_idle"),
    signing: t("escrow_txStatus_signing"),
    pending: t("escrow_txStatus_pending"),
    success: t("escrow_txStatus_success"),
    failed: t("escrow_txStatus_failed"),
  };
  const L = { ...defaultLabels, ...labels };
  /** failed 优先于 success，避免「上一笔已成功」与当前拒绝/失败并存时误显绿勾（B-030） */
  const statusLabel =
    pending ? L.pending :
    failed ? L.failed :
    success ? L.success :
    signing ? L.signing : L.idle;

  const isDid = !!variantDid;
  const neutralStatusClass = isDid ? "text-slate-300" : "text-ink-700";
  const statusClass = failed
    ? "text-danger"
    : success
      ? "text-success"
      : neutralStatusClass;

  const prefixDefault = longPrefix ? t("escrow_txStatus_longPrefix") : t("escrow_txStatus_prefix");
  const prefixText = prefixProp ?? prefixDefault;
  const prefixClass = isDid ? "text-slate-300" : "text-ink-500";

  return (
    <p className="text-small">
      <span className={prefixClass}>{prefixText}：</span>
      <span className={statusClass}>{statusLabel}</span>
    </p>
  );
}
