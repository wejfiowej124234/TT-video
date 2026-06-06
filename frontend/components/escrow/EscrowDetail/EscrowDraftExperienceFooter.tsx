"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import EscrowCopySummaryButton from "./EscrowCopySummaryButton";
import EscrowOrderPrintButton from "./EscrowOrderPrintButton";
import EscrowDraftTravelNotice from "./EscrowDraftTravelNotice";
import {
  escrowExperienceDangerLinkClass,
  escrowExperienceFooterLinkClass,
  escrowExperienceFooterDividerClass,
  escrowExperienceFooterRowClass,
  escrowExperienceFooterSectionLabelClass,
  TT_ESCROW_EXPERIENCE_FOOTER_PANEL,
} from "@/lib/escrowExperienceUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export interface EscrowDraftExperienceFooterProps {
  marketHref: string;
  showMarketLink: boolean;
  showCancelOrder: boolean;
  showDeleteOrder: boolean;
  orderActionPending: boolean;
  onCancelOrder: () => void;
  onDeleteOrder: () => void;
  onCopySummary: () => void;
  copySummaryBusy: boolean;
  copySummaryDone: boolean;
}

/** ① Experience 草稿页脚：工具 + 合规分组（L5 字号 / 触控 / 对比度） */
export default function EscrowDraftExperienceFooter({
  marketHref,
  showMarketLink,
  showCancelOrder,
  showDeleteOrder,
  orderActionPending,
  onCancelOrder,
  onDeleteOrder,
  onCopySummary,
  copySummaryBusy,
  copySummaryDone,
}: EscrowDraftExperienceFooterProps) {
  const { t } = useTranslation();

  return (
    <footer
      data-tt-escrow-experience-footer="1"
      className={`${TT_ESCROW_EXPERIENCE_FOOTER_PANEL} mt-4 text-slate-100`}
      aria-label={t("escrow_experienceFooter_aria")}
    >
      <p className={escrowExperienceFooterSectionLabelClass}>{t("escrow_experienceFooter_toolsLabel")}</p>
      <div className={escrowExperienceFooterRowClass}>
        <EscrowOrderPrintButton variant="experience" />
        <EscrowCopySummaryButton
          variant="experience"
          onCopy={onCopySummary}
          busy={copySummaryBusy}
          done={copySummaryDone}
        />
        <Link
          href="/orders"
          className={`${touchTargetLink44Classes} ${escrowExperienceFooterLinkClass}`}
        >
          {t("escrow_backToOrders")}
        </Link>
        {showMarketLink ? (
          <Link
            href={marketHref}
            className={`${touchTargetLink44Classes} ${escrowExperienceFooterLinkClass}`}
          >
            {t("escrow_draftGuideMarketLink")}
          </Link>
        ) : null}
      </div>

      <div className={escrowExperienceFooterDividerClass}>
        <p className={escrowExperienceFooterSectionLabelClass}>{t("escrow_experienceFooter_helpLabel")}</p>
        <div className={escrowExperienceFooterRowClass}>
          <EscrowDraftTravelNotice compact />
          {showCancelOrder || showDeleteOrder ? (
            <details className="text-small text-slate-200">
              <summary
                className={`${touchTargetLink44Classes} ${escrowExperienceFooterLinkClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
              >
                {t("escrow_draftFooter_more")}
              </summary>
              <div className="mt-2.5 flex flex-col items-start gap-2.5 pl-0.5">
                {showCancelOrder ? (
                  <form
                    className="contents"
                    onSubmit={(e) => {
                      e.preventDefault();
                      onCancelOrder();
                    }}
                  >
                    <button
                      type="submit"
                      disabled={orderActionPending}
                      className={`${touchTargetLink44Classes} ${escrowExperienceFooterLinkClass} disabled:opacity-50`}
                      aria-busy={orderActionPending ? true : undefined}
                    >
                      {orderActionPending ? t("common_submitting") : t("escrow_cancelOrder")}
                    </button>
                  </form>
                ) : null}
                {showDeleteOrder ? (
                  <form
                    className="contents"
                    onSubmit={(e) => {
                      e.preventDefault();
                      onDeleteOrder();
                    }}
                  >
                    <button
                      type="submit"
                      disabled={orderActionPending}
                      className={`${touchTargetLink44Classes} ${escrowExperienceDangerLinkClass} disabled:opacity-50`}
                      aria-label={t("escrow_deleteOrder")}
                      aria-busy={orderActionPending ? true : undefined}
                    >
                      {orderActionPending ? t("common_submitting") : t("escrow_deleteOrder")}
                    </button>
                  </form>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
