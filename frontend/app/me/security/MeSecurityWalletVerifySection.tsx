"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { meSettingsHubHref } from "@/lib/me/meSettingsHubFlash";
import { MeSettingsL5Panel } from "@/components/me/MeSettingsL5Panel";
import { ME_SECURITY_PANEL_IDS, TT_ME_SECURITY_L5 } from "@/lib/me/meSecurityL5";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { useMeWalletVerify } from "./useMeWalletVerify";

export function MeSecurityWalletVerifySection() {
  const { t } = useTranslation();
  const vm = useMeWalletVerify(t);

  const badge = (
    <span className={vm.verified ? TT_ME_SECURITY_L5.badgeOk : TT_ME_SECURITY_L5.badgeMuted}>
      {vm.loadingStatus
        ? t("me_security_page_refreshing")
        : vm.verified
          ? t("me_security_wallet_badge_verified")
          : t("me_security_wallet_badge_unverified")}
    </span>
  );

  return (
    <MeSettingsL5Panel
      id={ME_SECURITY_PANEL_IDS.wallet}
      title={t("me_security_page_section_wallet_verify")}
      actions={badge}
    >
      {vm.success ? (
        <div className="mb-3 space-y-2" role="status">
          <p className="text-small text-success">{vm.success}</p>
          <Link
            href={meSettingsHubHref("wallet")}
            className="inline-flex text-meta font-semibold text-ref-sun/85 underline underline-offset-4 hover:text-[#fde9a8]"
          >
            {t("me_settings_flash_back_hub")}
          </Link>
        </div>
      ) : null}
      {vm.error ? (
        <p className="mb-3 text-small text-danger" role="alert">
          {vm.error}
        </p>
      ) : null}
      {vm.verified && vm.verifiedWalletPreview ? (
        <p className="mb-3 text-small text-slate-300">
          {t("me_security_wallet_status_verified")}:{" "}
          <span className="font-mono text-slate-100">{vm.verifiedWalletPreview}</span>
          {vm.verificationAgeSeconds != null && vm.verificationTtlSeconds != null ? (
            <span className="ml-2 text-meta text-slate-400">
              (
              {t("me_security_wallet_ttl_hint", {
                age: String(vm.verificationAgeSeconds),
                ttl: String(vm.verificationTtlSeconds),
              })}
              )
            </span>
          ) : null}
        </p>
      ) : (
        <p className="mb-3 text-small text-slate-400/95">{t("me_security_wallet_status_unverified")}</p>
      )}
      <p className="mb-3 text-meta text-slate-500/90">{t("me_security_wallet_phase1_hint")}</p>
      <WalletVerifyInputRow vm={vm} t={t} />
      <WalletVerifyActions vm={vm} t={t} />
    </MeSettingsL5Panel>
  );
}

function WalletVerifyInputRow({
  vm,
  t,
}: {
  vm: ReturnType<typeof useMeWalletVerify>;
  t: (k: string) => string;
}) {
  return (
    <div className="mb-3 space-y-2">
      <label className="block text-meta text-slate-400/95" htmlFor="me-security-wallet-input">
        {t("me_security_wallet_address_label")}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          id="me-security-wallet-input"
          type="text"
          autoComplete="off"
          value={vm.walletInput}
          onChange={(e) => vm.setWalletInput(e.target.value)}
          placeholder={t("auth_register_placeholder_wallet")}
          className={`w-full flex-1 font-mono ${TT_ME_SECURITY_L5.input}`}
          disabled={vm.verifying}
        />
        {vm.connectedAddress ? (
          <button
            type="button"
            onClick={vm.applyConnectedWallet}
            disabled={vm.verifying}
            className={TT_ME_SECURITY_L5.btnSecondary}
          >
            {t("me_security_wallet_use_connected")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function WalletVerifyActions({
  vm,
  t,
}: {
  vm: ReturnType<typeof useMeWalletVerify>;
  t: (k: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void vm.runVerify()}
        disabled={vm.verifying || vm.loadingStatus}
        className={TT_AUTH_L5_FORM.primaryCta}
      >
        {vm.verifying ? t("me_security_wallet_verifying") : t("me_security_wallet_verify_button")}
      </button>
      <button
        type="button"
        onClick={() => void vm.reloadStatus()}
        disabled={vm.verifying || vm.loadingStatus}
        className={TT_ME_SECURITY_L5.btnSecondary}
      >
        {t("me_security_page_refresh")}
      </button>
    </div>
  );
}
