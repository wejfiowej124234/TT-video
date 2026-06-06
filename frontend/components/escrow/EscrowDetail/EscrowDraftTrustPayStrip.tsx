"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_ESCROW_EXPERIENCE_PANEL } from "@/lib/escrowExperienceUi";

const TRUST_KEYS = [
  "escrow_draftPayTrust_lock",
  "escrow_draftPayTrust_usdc",
  "escrow_draftPayTrust_step3",
] as const;

export interface EscrowDraftTrustPayStripProps {
  /** 报价卡内 / 确认弹窗内 */
  variant?: "card" | "modal";
}

/** ① 草稿：确认前支付/托管预期（文案 only，非 ② 真付） */
export default function EscrowDraftTrustPayStrip({ variant = "card" }: EscrowDraftTrustPayStripProps) {
  const { t } = useTranslation();
  const shellClass =
    variant === "modal"
      ? "mt-3 pt-3 border-t border-ref-sun/15 space-y-1.5"
      : `${TT_ESCROW_EXPERIENCE_PANEL} mt-3 px-3 py-2.5 border-ref-sun/12 bg-black/20`;

  return (
    <div className={shellClass} role="note" aria-label={t("escrow_draftPayTrust_aria")}>
      <ul className="m-0 p-0 list-none space-y-1.5 text-meta text-white/70 leading-relaxed">
        {TRUST_KEYS.map((key) => (
          <li key={key} className="flex gap-2 items-start">
            <span className="text-ref-sun/90 shrink-0 mt-0.5" aria-hidden>
              ✓
            </span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
