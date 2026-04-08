"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { orderStateToStatusLabelKey } from "@/lib/orderStatusI18n";

/** 21/22 状态色：Success / Warning / Danger / Neutral 按状态映射，仅表达状态不装饰 */
function statusVariant(status: string): "success" | "warning" | "danger" | "neutral" {
  const s = (status || "").toLowerCase();
  if (
    s === "completed" ||
    s === "released" ||
    s === "resolved" ||
    s === "refunded" ||
    s === "partiallyrefunded" ||
    s === "partially_refunded" ||
    s === "slashed"
  )
    return "success";
  if (
    s === "disputed" ||
    s === "dispute" ||
    s === "cancelled" ||
    s === "canceled" ||
    s === "failed"
  )
    return "danger";
  if (
    s === "accepted" ||
    s === "escrowed" ||
    s === "created" ||
    s === "confirmed" ||
    s === "funded"
  )
    return "warning";
  return "neutral";
}

const variantClasses = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-ink-100 text-ink-600",
};

export default function StatusBadge({ status, sub_status }: { status: string; sub_status?: string }) {
  const { t } = useTranslation();
  const variant = statusVariant(status);
  const raw = (status || "").trim();
  const label = raw ? t(orderStateToStatusLabelKey({ status, sub_status })) : t("ui_em_dash");
  return (
    <span
      className={`inline-block rounded-[var(--radius-sm)] px-3 py-1 text-small transition-all duration-200 hover:shadow-soft ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}
