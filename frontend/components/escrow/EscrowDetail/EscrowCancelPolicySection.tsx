"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 54-S6：取消与退款规则区 — 深色协议底上标题/正文均为浅色字（与 P54-004 风险提示策略一致） */
export default function EscrowCancelPolicySection({ headingId }: { headingId: string }) {
  const { t } = useTranslation();
  return (
    <section
      className="rounded-[var(--radius-sm)] border border-slate-600/50 bg-slate-800/40 p-4"
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="text-small font-semibold text-slate-300">
        {t("order_cancelPolicyTitle")}
      </h3>
      <p className="text-small text-slate-300 mt-1 leading-relaxed">{t("order_cancelPolicyContent")}</p>
    </section>
  );
}
