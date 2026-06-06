"use client";

import { useConnect } from "wagmi";
import { guideRegFocusRing, guideRegPrimaryCta, guideRegSecondaryBtn } from "./guideRegisterUiClasses";

export default function GuideRegisterWalletConnectRow({
  t,
  isConnected,
}: {
  t: (key: string) => string;
  isConnected: boolean;
}) {
  const { connect, connectors, isPending } = useConnect();
  const ready = connectors.find((c) => c.ready);

  if (isConnected) {
    return (
      <button
        type="submit"
        formNoValidate
        data-guide-reg-intent="use_wallet"
        className={`w-full sm:w-auto ${guideRegSecondaryBtn} ${guideRegFocusRing}`}
      >
        {t("guideRegister_useCurrentWallet")}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!ready || isPending}
      aria-busy={isPending ? true : undefined}
      onClick={() => {
        if (ready) connect({ connector: ready });
      }}
      className={`w-full sm:w-auto ${guideRegPrimaryCta} px-4 py-2 text-small ${guideRegFocusRing}`}
    >
      {isPending ? t("guideRegister_connectingWallet") : t("guideRegister_connectWallet")}
    </button>
  );
}
