"use client";

import Link from "next/link";
import { useId } from "react";
import { passwordStrength } from "./utils";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import AuthL5FormError from "@/components/auth/AuthL5FormError";
import { TT_AUTH_L5_PAGE_COLUMN } from "@/lib/auth/authL5Shell";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { registerPageShellClass, type RegisterVisualKind } from "./registerBackgrounds";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import { ProviderOnboardingProgress } from "@/components/provider/ProviderOnboardingProgress";
import RegisterVerificationCodeField from "./RegisterVerificationCodeField";

export type RegisterTouristFormProps = {
  mainClassName?: string;
  backdropKind?: Exclude<RegisterVisualKind, "default">;
  headingKey?: string;
  bannerKey?: string;
  loginHref: string;
  autoFocusEmail?: boolean;
  email: string;
  setEmail: (v: string) => void;
  verificationCode: string;
  setVerificationCode: (v: string) => void;
  sendCodeBusy: boolean;
  sendCodeCooldown: number;
  devCodeHint: string | null;
  onSendVerificationCode: () => void;
  nickname: string;
  setNickname: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  passwordConfirm: string;
  setPasswordConfirm: (v: string) => void;
  defaultWallet: string;
  setDefaultWallet: (v: string) => void;
  error: string | null;
  loading: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  getErrorDisplay: (err: string | null) => string | null;
  t: (key: string) => string;
  inputClass: string;
  labelClass: string;
};

export default function RegisterTouristForm({
  mainClassName = registerPageShellClass(),
  backdropKind = "traveler",
  headingKey = "auth_register_traveler",
  bannerKey,
  submitLabelKey = "auth_register_submit",
  providerProgressStep,
  loginHref,
  autoFocusEmail = true,
  email,
  setEmail,
  verificationCode,
  setVerificationCode,
  sendCodeBusy,
  sendCodeCooldown,
  devCodeHint,
  onSendVerificationCode,
  nickname,
  setNickname,
  password,
  setPassword,
  passwordConfirm,
  setPasswordConfirm,
  defaultWallet,
  setDefaultWallet,
  error,
  loading,
  onBack,
  onSubmit,
  getErrorDisplay,
  t,
  inputClass,
  labelClass,
}: RegisterTouristFormProps) {
  const formErrorId = useId();
  const fid = useId();
  const emailInputId = `${fid}-email`;
  const verificationCodeInputId = `${fid}-verification-code`;
  const nicknameInputId = `${fid}-nickname`;
  const passwordInputId = `${fid}-password`;
  const passwordConfirmInputId = `${fid}-password-confirm`;
  const defaultWalletInputId = `${fid}-default-wallet`;
  const footerLinkClass = `${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`;

  return (
    <main
      className={mainClassName}
      aria-label={t(headingKey)}
      data-tt-auth-root="1"
      data-tt-auth-route="register"
      data-tt-auth-surface="register_form_shell"
      data-tt-auth-register-role={backdropKind}
      data-tt-auth-visual="l5"
      data-tt-auth-register-ui-frozen="1"
    >
      <AuthL5PageBackdrop />
      <div className={`${TT_AUTH_L5_PAGE_COLUMN} gap-6`}>
        <AuthL5Card surface="register_l5_card">
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onBack();
            }}
          >
            <button type="submit" data-tt-auth-register-back="1" className={TT_AUTH_L5_FORM.backButton}>
              {t("auth_register_back")}
            </button>
          </form>
          {bannerKey ? <p className={TT_AUTH_L5_FORM.banner}>{t(bannerKey)}</p> : null}
          {providerProgressStep != null ? (
            <ProviderOnboardingProgress currentStep={providerProgressStep} className="mb-4" />
          ) : null}
          <header className={`${TT_AUTH_L5_FORM.headerBlock} pb-4`}>
            <h1 className={TT_AUTH_L5_FORM.titleLogin}>{t(headingKey)}</h1>
          </header>
          <TrustGrowthMomentBanner moment="register" surface="l5" preferCollapsedSummary />
          <form
            noValidate
            onSubmit={onSubmit}
            className="flex min-w-0 flex-col gap-4"
            data-tt-auth-surface="register_form_fields"
          >
            <div className={TT_AUTH_L5_FORM.fieldGroup}>
              <label htmlFor={emailInputId} className={labelClass}>
                {t("auth_register_email")}
              </label>
              <input
                id={emailInputId}
                type="email"
                autoFocus={autoFocusEmail}
                placeholder={t("auth_register_email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                autoComplete="email"
                aria-invalid={!!error}
                aria-describedby={error ? formErrorId : undefined}
              />
            </div>
            <RegisterVerificationCodeField
              t={t}
              labelClass={labelClass}
              inputClass={inputClass}
              codeInputId={verificationCodeInputId}
              verificationCode={verificationCode}
              setVerificationCode={setVerificationCode}
              sendCodeBusy={sendCodeBusy}
              sendCodeCooldown={sendCodeCooldown}
              devCodeHint={devCodeHint}
              onSendCode={onSendVerificationCode}
            />
            <div className={TT_AUTH_L5_FORM.fieldGroup}>
              <label htmlFor={nicknameInputId} className={labelClass}>
                {t("auth_register_nickname")}
              </label>
              <input
                id={nicknameInputId}
                type="text"
                placeholder={t("auth_register_nickname")}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={inputClass}
                autoComplete="nickname"
              />
            </div>
            <div className={TT_AUTH_L5_FORM.fieldGroup}>
              <label htmlFor={passwordInputId} className={labelClass}>
                {t("auth_register_password")}
              </label>
              <input
                id={passwordInputId}
                type="password"
                placeholder={t("auth_register_passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
                autoComplete="new-password"
              />
              {password &&
                (() => {
                  const s = passwordStrength(password);
                  return s.labelKey ? (
                    <p className={s.ok ? TT_AUTH_L5_FORM.passwordHintOk : TT_AUTH_L5_FORM.passwordHintWarn}>
                      {t(s.labelKey)}
                    </p>
                  ) : null;
                })()}
            </div>
            <div className={TT_AUTH_L5_FORM.fieldGroup}>
              <label htmlFor={passwordConfirmInputId} className={labelClass}>
                {t("auth_register_confirmPassword")}
              </label>
              <input
                id={passwordConfirmInputId}
                type="password"
                placeholder={t("auth_register_confirmPlaceholder")}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <div className={TT_AUTH_L5_FORM.fieldGroup}>
              <label htmlFor={defaultWalletInputId} className={labelClass}>
                {t("auth_register_defaultWallet")}
              </label>
              <input
                id={defaultWalletInputId}
                type="text"
                placeholder={t("auth_register_walletPlaceholder")}
                value={defaultWallet}
                onChange={(e) => setDefaultWallet(e.target.value)}
                className={inputClass}
              />
              <p className={TT_AUTH_L5_FORM.metaText}>{t("auth_register_walletHint")}</p>
            </div>
            {error ? (
              <AuthL5FormError id={formErrorId} message={getErrorDisplay(error)} surface="register_form_error" />
            ) : null}
            <button
              type="submit"
              data-tt-auth-register-submit="1"
              disabled={loading}
              aria-busy={loading ? true : undefined}
              className={TT_AUTH_L5_FORM.primaryCta}
            >
              {loading ? t("auth_register_submitting") : t(submitLabelKey)}
            </button>
          </form>
          <p className={TT_AUTH_L5_FORM.footerMeta} data-tt-auth-surface="register_footer_links">
            <Link href={loginHref} className={footerLinkClass}>
              {t("auth_register_loginLink")}
            </Link>
            <span className="text-ref-sun/30" aria-hidden>
              ·
            </span>
            <Link href="/" className={footerLinkClass}>
              {t("auth_register_web3Travel")}
            </Link>
            <span className="text-ref-sun/30" aria-hidden>
              ·
            </span>
            <Link href="/me/identities" className={footerLinkClass}>
              {t("header_multiIdentity")}
            </Link>
          </p>
        </AuthL5Card>
        <AuthL5CrossNavFooter />
      </div>
    </main>
  );
}
