import { shortEvmAddress } from "@/lib/formatEvmAddress";
import type { ConfirmAction } from "./types";

type TFn = (key: string) => string;

export interface EscrowTxModalDetailsListProps {
  t: TFn;
  modalDetailsId: string;
  chainId: number;
  wrongChain: boolean;
  expectedChainId: number;
  escrowAddress: string | null | undefined;
  functionLabel: string;
  amount: string;
  currency: string;
  settlementTokenAddress?: `0x${string}`;
  settlementTokenSymbol?: string;
  hasEscrowAddr: boolean;
  action: ConfirmAction;
  depositAmountOnChain?: bigint;
  snapshotHash: string | null;
  gasUnits: bigint | undefined;
  gasPending: boolean;
  gasFailed: boolean;
  ulClass: string;
  labelSpanClass: string;
  sansMutedClass: string;
}

export function EscrowTxModalDetailsList({
  t,
  modalDetailsId,
  chainId,
  wrongChain,
  expectedChainId,
  escrowAddress,
  functionLabel,
  amount,
  currency,
  settlementTokenAddress,
  settlementTokenSymbol,
  hasEscrowAddr,
  action,
  depositAmountOnChain,
  snapshotHash,
  gasUnits,
  gasPending,
  gasFailed,
  ulClass,
  labelSpanClass,
  sansMutedClass,
}: EscrowTxModalDetailsListProps) {
  return (
    <ul id={modalDetailsId} className={ulClass}>
      <li>
        <span className={labelSpanClass}>{t("escrow_chainId")}</span>
        {chainId}
      </li>
      {wrongChain && (
        <li className="text-warning font-sans" role="alert">
          {t("escrow_wrongChainDesc")
            .replace("{expectedChainId}", String(expectedChainId))
            .replace("{chainId}", String(chainId))}
        </li>
      )}
      <li>
        <span className={labelSpanClass}>{t("escrow_contract")}</span>
        {escrowAddress}
      </li>
      <li>
        <span className={labelSpanClass}>{t("escrow_function")}</span>
        {functionLabel}
      </li>
      <li>
        <span className={labelSpanClass}>{t("escrow_amount")}</span>
        {amount} {currency}
      </li>
      <li>
        <span className={labelSpanClass}>{t("escrow_token")}</span>
        {settlementTokenAddress ? (
          <span title={settlementTokenAddress}>
            {settlementTokenSymbol ? `${settlementTokenSymbol} · ` : ""}
            {shortEvmAddress(settlementTokenAddress)}
          </span>
        ) : hasEscrowAddr ? (
          <span className={sansMutedClass}>{t("escrow_settlementTokenPending")}</span>
        ) : (
          <span className={sansMutedClass}>{t("escrow_tokenWhitelist")}</span>
        )}
      </li>
      {action === "deposit" && depositAmountOnChain !== undefined && (
        <li>
          <span className={labelSpanClass}>{t("escrow_depositAmountOnChain")}</span>
          {depositAmountOnChain.toString()}
        </li>
      )}
      {snapshotHash && (
        <li>
          <span className={labelSpanClass}>{t("escrow_snapshotHashLabel")}</span>
          <span className="break-all">{snapshotHash}</span>
        </li>
      )}
      <li>
        <span className={labelSpanClass}>{t("escrow_platformFeeBps")}</span>
        {t("escrow_platformFeeFromContract")}
      </li>
      <li>
        <span className={labelSpanClass}>{t("escrow_gas")}</span>
        {gasUnits != null ? (
          <span title={t("escrow_gasWalletFinalNote")}>
            {t("escrow_gasLineEstimated").replace("{{units}}", gasUnits.toString())}
          </span>
        ) : gasPending ? (
          <span className={sansMutedClass}>{t("escrow_gasEstimating")}</span>
        ) : gasFailed ? (
          <span className={sansMutedClass}>{t("escrow_gasEstimateUnavailable")}</span>
        ) : (
          <span>{t("escrow_gasFromWallet")}</span>
        )}
      </li>
      <li>
        <span className={labelSpanClass}>{t("escrow_finalityN")}</span>
        {t("escrow_finalityBlocks")}
      </li>
    </ul>
  );
}
