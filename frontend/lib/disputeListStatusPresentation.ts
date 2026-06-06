import type { LocaleTranslateFn } from "@/lib/i18n";

export type DisputeListStatusPresentation = { label: string; className: string };

/** 争议列表/详情共用状态 pill（L5 设置族延伸 · success/warning/ref-sun） */
export function disputeListStatusPresentation(
  status: string | undefined,
  t: LocaleTranslateFn
): DisputeListStatusPresentation {
  const raw = typeof status === "string" ? status.trim() : "";
  const norm = raw.toLowerCase();
  if (norm === "resolved") {
    return { label: t("disputes_statusResolved"), className: "bg-success/15 text-success" };
  }
  if (norm === "open") {
    return { label: t("disputes_statusOpen"), className: "bg-ref-sun/12 text-ref-sun" };
  }
  if (norm === "pending") {
    return { label: t("disputes_statusPending"), className: "bg-warning/15 text-warning" };
  }
  const display =
    raw === ""
      ? t("ui_em_dash")
      : raw.length > 40
        ? `${raw.slice(0, 37)}…`
        : raw;
  return {
    label: t("disputes_statusUnknown", { status: display }),
    className: "bg-slate-700/50 text-slate-300",
  };
}
