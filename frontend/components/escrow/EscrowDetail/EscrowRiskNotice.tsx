"use client";

import { useTranslation } from "@/components/LocaleProvider";

export interface EscrowRiskNoticeProps {
  disputeDeadlineAt?: string;
  disputeWindowExpired?: boolean;
}

export default function EscrowRiskNotice({ disputeDeadlineAt, disputeWindowExpired }: EscrowRiskNoticeProps) {
  const { t } = useTranslation();
  /* 54-S4：协议控制台区为深色底，正文须浅色字以保证可读（风险提示深底深字修复） */
  return (
    <div className="rounded-[var(--radius-sm)] border border-warning/40 bg-slate-800/50 p-4">
      <p className="text-small font-semibold text-warning/95">{t("escrow_riskTitle")}</p>
      <ul className="text-small text-slate-300 mt-1 space-y-0.5">
        {disputeDeadlineAt ? (
          disputeWindowExpired
            ? <li>{t("escrow_disputeWindowPast").replace("{deadline}", disputeDeadlineAt)}</li>
            : <li>{t("escrow_disputeWindowDeadline").replace("{deadline}", disputeDeadlineAt)}</li>
        ) : (
          <li>{t("escrow_disputeWindowPending")}</li>
        )}
        <li>{t("escrow_reorgRefresh")}</li>
        <li>{t("escrow_irreversible")}</li>
        <li>{t("order_emergencyContact")}</li>
        <li>{t("order_insuranceHint")}</li>
      </ul>
    </div>
  );
}
