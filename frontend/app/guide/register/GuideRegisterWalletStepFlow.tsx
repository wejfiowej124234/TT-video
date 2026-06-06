"use client";

import GuideRegisterConnectedWalletBar from "./GuideRegisterConnectedWalletBar";
import GuideRegisterWalletConnectRow from "./GuideRegisterWalletConnectRow";
import GuideRegisterWalletVerifySection from "./GuideRegisterWalletVerifySection";
import GuideRegisterInlineFieldError from "./GuideRegisterInlineFieldError";
import { isValidWalletAddress, walletToDidEthr } from "./utils";
import {
  guideRegFieldClass,
  guideRegFileMeta,
  guideRegFocusRing,
  guideRegLabel,
  guideRegSecondaryBtn,
} from "./guideRegisterUiClasses";

/** 步骤 1 内：连接 → 填写/确认地址 → 签名验证 */
export default function GuideRegisterWalletStepFlow({
  t,
  walletInputId,
  walletErrorId,
  walletAddress,
  setWalletAddress,
  clearSubmitError,
  isConnected,
  connectedAddress,
  walletMatchConnected,
  copied,
  copyWalletBusy,
  walletVerified,
  walletVerifying,
  walletVerifyError,
  onWalletVerify,
  onUseConnectedWallet,
  fieldInlineError,
}: {
  t: (key: string) => string;
  walletInputId: string;
  walletErrorId: string;
  walletAddress: string;
  setWalletAddress: (v: string) => void;
  clearSubmitError: () => void;
  isConnected: boolean;
  connectedAddress: string | undefined;
  walletMatchConnected: boolean;
  copied: boolean;
  copyWalletBusy: boolean;
  walletVerified: boolean;
  walletVerifying: boolean;
  walletVerifyError: string | null;
  onWalletVerify: () => void;
  onUseConnectedWallet: () => void;
  fieldInlineError: string | null;
}) {
  const walletInvalid =
    !!(walletAddress.trim() && !isValidWalletAddress(walletAddress)) || !!fieldInlineError;
  /** 始终展示地址栏，支持先粘贴再连接钱包（L5 UX） */
  const showAddressFields = true;

  return (
    <ol className="flex list-decimal flex-col gap-4 pl-5 text-meta text-slate-300/95 marker:text-ref-sun/80">
      <li>
        <span className="mb-2 block font-medium text-slate-200">{t("guideRegister_walletStepConnect")}</span>
        <GuideRegisterWalletConnectRow t={t} isConnected={isConnected} />
      </li>
      {showAddressFields ? (
        <li>
          <span className="mb-2 block font-medium text-slate-200">{t("guideRegister_walletStepAddress")}</span>
          {isConnected && connectedAddress ? (
            <GuideRegisterConnectedWalletBar t={t} address={connectedAddress} onUse={onUseConnectedWallet} />
          ) : null}
          <label className={`${guideRegLabel} mt-2`} htmlFor={walletInputId}>
            {t("guideRegister_walletLabel")} <span className="text-ref-coral">*</span>
          </label>
          <input
            id={walletInputId}
            type="text"
            value={walletAddress}
            onChange={(e) => {
              setWalletAddress(e.target.value);
              clearSubmitError();
            }}
          className={`mt-1 w-full font-mono ${guideRegFieldClass(walletInvalid)}`}
          placeholder={t("guideRegister_placeholderWallet")}
          data-tt-guide-register-wallet-input="1"
            aria-invalid={walletInvalid || undefined}
            aria-describedby={walletInvalid ? walletErrorId : undefined}
          />
          {walletAddress.trim() && !isValidWalletAddress(walletAddress) ? (
            <p id={walletErrorId} className="mt-1 text-meta text-ref-coral/95" role="alert">
              {t("guideRegister_walletFormatError")}
            </p>
          ) : null}
          <GuideRegisterInlineFieldError message={fieldInlineError} />
          {walletMatchConnected ? (
            <p className="mt-1 text-meta text-ref-sun/90">{t("guideRegister_walletMatch")}</p>
          ) : null}
          {walletAddress.trim() && isValidWalletAddress(walletAddress) ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={guideRegFileMeta}>{t("guideRegister_didEquivalent")}</span>
              <code className="text-meta font-mono text-ref-sun/85 break-all rounded-lg bg-ref-sun/10 px-1.5 py-0.5">
                {walletToDidEthr(walletAddress)}
              </code>
              <button
                type="submit"
                formNoValidate
                data-guide-reg-intent="copy_wallet"
                disabled={copyWalletBusy}
                className={`${guideRegSecondaryBtn} text-meta px-2 py-0.5 disabled:cursor-wait disabled:opacity-60 ${guideRegFocusRing}`}
              >
                {copied ? t("guideRegister_copied") : t("guideRegister_copyAddress")}
              </button>
            </div>
          ) : null}
        </li>
      ) : null}
      {walletAddress.trim() && isValidWalletAddress(walletAddress) ? (
        <li>
          <span className="mb-2 block font-medium text-slate-200">{t("guideRegister_walletStepVerify")}</span>
          <GuideRegisterWalletVerifySection
            t={t}
            walletVerified={walletVerified}
            verifying={walletVerifying}
            error={walletVerifyError}
            onVerify={onWalletVerify}
          />
        </li>
      ) : null}
    </ol>
  );
}
