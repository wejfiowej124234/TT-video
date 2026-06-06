"use client";

import type { PayPageViewModel } from "./usePayPage";
import { payHubStepsClass } from "@/lib/pay/payHubL5";

export function PayPagePrimaryCardStepsList({ vm }: { vm: PayPageViewModel }) {
  const { t, mayOnchainDeposit, emphasizeEscrowHub, awaitingOrderSlice } = vm;
  return (
    <ol className={payHubStepsClass}>
      {mayOnchainDeposit ? (
        <>
          <li>{t("pay_step1")}</li>
          <li>{t("pay_step2")}</li>
          <li>{t("pay_step3")}</li>
        </>
      ) : emphasizeEscrowHub ? (
        <>
          <li>{t("pay_escrowHub_step1")}</li>
          <li>{t("pay_escrowHub_step2")}</li>
          <li>{t("pay_escrowHub_step3")}</li>
        </>
      ) : awaitingOrderSlice ? (
        <>
          <li>{t("pay_stepsWhileLoading_1")}</li>
          <li>{t("pay_stepsWhileLoading_2")}</li>
          <li>{t("pay_stepsWhileLoading_3")}</li>
        </>
      ) : (
        <>
          <li>{t("pay_stepsNeutral_1")}</li>
          <li>{t("pay_stepsNeutral_2")}</li>
          <li>{t("pay_stepsNeutral_3")}</li>
        </>
      )}
    </ol>
  );
}
