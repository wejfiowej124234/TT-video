"use client";

import { formatUnits } from "viem";

import { mapWalletWriteError } from "@/lib/mapWalletWriteError";
import {
  touchTargetLink44Classes,
} from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_BTN_CONSOLE_NEUTRAL_SOLID,
  TT_MARKETING_BTN_CONSOLE_TRUST,
  TT_MARKETING_BTN_WARM_OUTLINE_COMPACT,
  TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE,
} from "@/lib/marketingUi";

import { StakingTxFacts } from "./StakingTxFacts";
import { STAKE_WRITE_ERROR_OPTS } from "./stakingStakeWriteErrorOpts";
import type { StakingStakePanelViewModel } from "./useStakingStakePanel";

type Vm = StakingStakePanelViewModel;

export function StakingStakePanelConnected({ vm }: { vm: Vm }) {
  const {
    t,
    stakeTitleKey,
    titleId,
    stakeAmountFieldId,
    stakeAmountErrorRegionId,
    stakingAddress,
    expectedChainId,
    amountStr,
    setAmountStr,
    decimals,
    minStakeRead,
    balanceRead,
    allowanceRead,
    parsedAmount,
    belowMin,
    exceedsBalance,
    amountParseInvalid,
    stakeAmountInvalid,
    needsApproval,
    amountDisplay,
    approvePending,
    approveConfirming,
    approveWriteErr,
    stakePending,
    stakeConfirming,
    stakeWriteErr,
    busy,
    onApprove,
    onStake,
    setMaxFromBalance,
    token,
  } = vm;

  const approveErr = mapWalletWriteError(approveWriteErr as Error | undefined, t, STAKE_WRITE_ERROR_OPTS);
  const stakeErr = mapWalletWriteError(stakeWriteErr as Error | undefined, t, STAKE_WRITE_ERROR_OPTS);

  return (
    <section
      className="mt-8 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-5 shadow-soft"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
        {t(stakeTitleKey)}
      </h2>
      <p className="mt-1 text-body text-ink-600">{t("staking_stake_subtitle")}</p>

      {minStakeRead.data !== undefined && decimals !== undefined ? (
        <p className="mt-2 text-meta text-ink-600">
          {t("staking_stake_minHint")}
          {t("market_fin_colon")}
          {formatUnits(minStakeRead.data, decimals)} ({t("staking_stake_minTotalNote")})
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label htmlFor={stakeAmountFieldId} className="text-small text-ink-700">
          {t("staking_stake_amountLabel")}
          <input
            id={stakeAmountFieldId}
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            disabled={busy || decimals === undefined}
            aria-invalid={stakeAmountInvalid}
            aria-errormessage={stakeAmountInvalid ? stakeAmountErrorRegionId : undefined}
            className={`mt-1 block min-h-[44px] w-48 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 text-body text-ink-900 ${TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE} focus-visible:ring-offset-white`}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            setMaxFromBalance();
          }}
        >
          <button
            type="submit"
            disabled={busy || balanceRead.data === undefined || decimals === undefined}
            aria-busy={busy ? true : undefined}
            className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_WARM_OUTLINE_COMPACT} disabled:opacity-50 focus-visible:ring-offset-bg-main`}
          >
            {t("staking_stake_max")}
          </button>
        </form>
      </div>

      {balanceRead.data !== undefined && decimals !== undefined ? (
        <p className="mt-2 text-meta text-ink-600">
          {t("staking_stake_walletBalance")}
          {t("market_fin_colon")}
          {formatUnits(balanceRead.data, decimals)}
        </p>
      ) : null}
      {allowanceRead.data !== undefined && decimals !== undefined ? (
        <p className="mt-1 text-meta text-ink-600">
          {t("staking_stake_allowance")}
          {t("market_fin_colon")}
          {formatUnits(allowanceRead.data, decimals)}
        </p>
      ) : null}

      {stakeAmountInvalid ? (
        <div id={stakeAmountErrorRegionId} className="mt-3 space-y-2" role="alert">
          {exceedsBalance ? <p className="text-body text-warning">{t("staking_stake_exceedsBalance")}</p> : null}
          {belowMin ? <p className="text-body text-warning">{t("staking_stake_belowMin")}</p> : null}
          {amountParseInvalid ? <p className="text-body text-danger">{t("staking_stake_invalidAmount")}</p> : null}
        </div>
      ) : null}

      {token && stakingAddress ? (
        <div className="mt-4 space-y-4">
          {needsApproval && parsedAmount && parsedAmount > BigInt(0) ? (
            <>
              <StakingTxFacts
                expectedChainId={expectedChainId}
                stakingAddress={stakingAddress}
                tokenAddress={token}
                amountDisplay={amountDisplay}
                action="approve"
              />
              {approveErr ? (
                <p className="text-small text-danger" role="alert">
                  {approveErr}
                </p>
              ) : null}
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  onApprove();
                }}
              >
                <button
                  type="submit"
                  disabled={busy || belowMin || exceedsBalance || parsedAmount === undefined}
                  aria-busy={busy ? true : undefined}
                  className={`${TT_MARKETING_BTN_CONSOLE_NEUTRAL_SOLID} justify-center text-center`}
                >
                  {approvePending || approveConfirming ? t("staking_stake_pending") : t("staking_stake_approve")}
                </button>
              </form>
            </>
          ) : null}

          {!needsApproval && parsedAmount && parsedAmount > BigInt(0) ? (
            <>
              <StakingTxFacts
                expectedChainId={expectedChainId}
                stakingAddress={stakingAddress}
                tokenAddress={token}
                amountDisplay={amountDisplay}
                action="stake"
              />
              {stakeErr ? (
                <p className="text-small text-danger" role="alert">
                  {stakeErr}
                </p>
              ) : null}
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  onStake();
                }}
              >
                <button
                  type="submit"
                  disabled={busy || belowMin || exceedsBalance}
                  aria-busy={busy ? true : undefined}
                  className={`${TT_MARKETING_BTN_CONSOLE_TRUST} justify-center text-center font-semibold`}
                >
                  {stakePending || stakeConfirming ? t("staking_stake_pending") : t("staking_stake_submit")}
                </button>
              </form>
            </>
          ) : null}

          {!parsedAmount || parsedAmount === BigInt(0) ? (
            <p className="text-meta text-ink-500">{t("staking_stake_enterAmount")}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-body text-ink-600">{t("staking_contract_loading")}</p>
      )}
    </section>
  );
}
