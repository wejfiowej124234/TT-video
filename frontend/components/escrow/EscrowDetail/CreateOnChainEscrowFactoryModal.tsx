"use client";

import { type FormEvent, type RefObject } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import TxMachineStatus from "@/components/escrow/TxMachineStatus";
import { escrowModalPortalRootClass, escrowModalScrimClass } from "@/components/market/marketStudioModalLayout";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL, TT_MARKETING_BTN_WARM_OUTLINE_COMPACT} from "@/lib/marketingUi";

import { createOnChainEscrowFactoryModalUi } from "./createOnChainEscrowBlockModel";
import type { OrderRow } from "./types";

export interface CreateOnChainEscrowFactoryModalProps {
  trapRef: RefObject<HTMLDivElement | null>;
  factoryModalTitleId: string;
  factoryModalDescId: string;
  factoryModalDetailsId: string;
  factoryModalNoteId: string;
  variantDid?: boolean;
  protocolPaused: boolean;
  chainId: number;
  factory: `0x${string}` | null | undefined;
  order: Pick<OrderRow, "amount" | "currency">;
  travelerAddr: string | null;
  guideAddr: string | null;
  snapshotHash: string | null;
  isPending: boolean;
  showSuccess: boolean;
  showFailed: boolean;
  factoryModalErrorMessage: string | null;
  builtOk: boolean;
  chainMismatch: boolean;
  onRetry: () => void;
  onClose: () => void;
  onConfirmSign: () => void;
}

export function CreateOnChainEscrowFactoryModal({
  trapRef,
  factoryModalTitleId,
  factoryModalDescId,
  factoryModalDetailsId,
  factoryModalNoteId,
  variantDid,
  protocolPaused,
  chainId,
  factory,
  order,
  travelerAddr,
  guideAddr,
  snapshotHash,
  isPending,
  showSuccess,
  showFailed,
  factoryModalErrorMessage,
  builtOk,
  chainMismatch,
  onRetry,
  onClose,
  onConfirmSign,
}: CreateOnChainEscrowFactoryModalProps) {
  const { t } = useTranslation();
  const ui = createOnChainEscrowFactoryModalUi(variantDid);
  const isDid = !!variantDid;

  return (
    <div
      className={escrowModalPortalRootClass}
      aria-modal="true"
      role="dialog"
      aria-labelledby={factoryModalTitleId}
      aria-describedby={`${factoryModalDescId} ${factoryModalDetailsId} ${factoryModalNoteId}`}
      data-tt-escrow-factory-create-modal="1"
    >
      <div className={escrowModalScrimClass} aria-hidden />
      <div ref={trapRef} className={ui.modalPanelClass}>
        <h3 id={factoryModalTitleId} className={ui.modalTitleClass}>
          {t("escrow_factoryCreateModalTitle")}
        </h3>
        <p id={factoryModalDescId} className={ui.modalDescClass}>
          {t("escrow_signConfirmDesc")}
        </p>
        <ul id={factoryModalDetailsId} className={ui.modalUlClass}>
          <li>
            <span className={ui.modalLabelClass}>{t("escrow_chainId")}</span>
            {chainId}
          </li>
          <li>
            <span className={ui.modalLabelClass}>{t("escrow_contract")}</span>
            {factory ?? t("ui_em_dash")}
          </li>
          <li>
            <span className={ui.modalLabelClass}>{t("escrow_function")}</span>
            createEscrow(EscrowParams)
          </li>
          <li>
            <span className={ui.modalLabelClass}>{t("escrow_amount")}</span>
            {order.amount} {order.currency}
          </li>
          <li>
            <span className={ui.modalLabelClass}>{t("escrow_travelerParam")}</span>
            {travelerAddr ?? t("ui_em_dash")}
          </li>
          <li>
            <span className={ui.modalLabelClass}>{t("escrow_guideParam")}</span>
            {guideAddr ?? t("ui_em_dash")}
          </li>
          {snapshotHash && (
            <li>
              <span className={ui.modalLabelClass}>{t("escrow_snapshotHashLabel")}</span>
              <span className="break-all">{snapshotHash}</span>
            </li>
          )}
          <li>
            <span className={ui.modalLabelClass}>{t("escrow_gas")}</span>
            {t("escrow_gasFromWallet")}
          </li>
          <li>
            <span className={ui.modalLabelClass}>{t("escrow_finalityN")}</span>
            {t("escrow_finalityBlocks")}
          </li>
        </ul>
        <TxMachineStatus
          pending={isPending}
          success={showSuccess}
          failed={showFailed}
          variantDid={variantDid}
          signing={!isPending && !showSuccess && !showFailed}
        />
        {factoryModalErrorMessage ? (
          <div className="space-y-2">
            <ApiErrorAlert message={factoryModalErrorMessage} tone={isDid ? "dark" : "default"} />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void onRetry();
              }}
            >
              <button
                type="submit"
                aria-label={t("common_retry")}
                className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border px-3 py-2 text-small font-medium disabled:opacity-50 ${
                  isDid
                    ? `border-ink-500/60 bg-ink-800/70 text-slate-200 hover:bg-ink-800 ${ui.factoryModalCtaFocusClass}`
                    : TT_MARKETING_BTN_WARM_OUTLINE_COMPACT
                }`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        ) : null}
        {showSuccess && (
          <p className="text-meta text-success" role="status">
            {t("escrow_factoryCreateSynced")}
          </p>
        )}
        <p id={factoryModalNoteId} className={ui.modalNoteClass} role="note">
          {t("escrow_doNotResubmit")}
        </p>
        <div className="flex gap-3 justify-end">
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button type="submit" className={ui.modalCancelClass}>
              {showSuccess || showFailed ? t("escrow_close") : t("common_cancel")}
            </button>
          </form>
          {!showSuccess && !showFailed && (
            <form
              className="contents"
              onSubmit={(e) => {
                e.preventDefault();
                void onConfirmSign();
              }}
            >
              <button
                type="submit"
                disabled={protocolPaused || isPending || !builtOk || chainMismatch}
                aria-busy={isPending ? true : undefined}
                className={`${TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL} disabled:opacity-50${isDid ? ` ${ui.factoryModalCtaFocusClass}` : ""}`}
              >
                {isPending ? t("escrow_confirming") : t("escrow_confirmAndSign")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
