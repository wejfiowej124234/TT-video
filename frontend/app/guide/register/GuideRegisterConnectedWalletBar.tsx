"use client";

import { guideRegFileMeta, guideRegFocusRing, guideRegSecondaryBtn } from "./guideRegisterUiClasses";

export default function GuideRegisterConnectedWalletBar({
  t,
  address,
  onUse,
}: {
  t: (key: string) => string;
  address: string;
  onUse: () => void;
}) {
  const short = address.length > 12 ? `${address.slice(0, 8)}…${address.slice(-6)}` : address;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ref-sun/28 bg-ref-sun/10 px-3 py-2">
      <p className={guideRegFileMeta}>
        <span className="text-ref-sun">{t("guideRegister_walletConnected")}</span>{" "}
        <span className="font-mono text-ref-sun/90">{short}</span>
      </p>
      <button type="button" onClick={onUse} className={`${guideRegSecondaryBtn} text-meta px-3 py-1 ${guideRegFocusRing}`}>
        {t("guideRegister_useCurrentWallet")}
      </button>
    </div>
  );
}
