"use client";

import Link from "next/link";
import { useId } from "react";
import AuthShellCrossNav from "@/components/auth/AuthShellCrossNav";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { ACCEPT_ID, ACCEPT_LANG } from "./constants";
import RegisterPageBackdrop from "./RegisterPageBackdrop";
import { registerPageShellClass, type RegisterVisualKind } from "./registerBackgrounds";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import { passwordStrength } from "./utils";

export type RegisterGuideFormProps = {
  mainClassName?: string;
  backdropKind?: Exclude<RegisterVisualKind, "default">;
  loginHref: string;
  /** 进入本步时聚焦账号区邮箱 */
  autoFocusAccountEmail?: boolean;
  email: string;
  setEmail: (v: string) => void;
  nickname: string;
  setNickname: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  passwordConfirm: string;
  setPasswordConfirm: (v: string) => void;
  realName: string;
  setRealName: (v: string) => void;
  idNumber: string;
  setIdNumber: (v: string) => void;
  walletAddress: string;
  setWalletAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  countryCode: string;
  setCountryCode: (v: string) => void;
  languages: string;
  setLanguages: (v: string) => void;
  serviceTypes: string;
  setServiceTypes: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  idPhotoFile: File | null;
  setIdPhotoFile: (f: File | null) => void;
  languageCertFile: File | null;
  setLanguageCertFile: (f: File | null) => void;
  agreePrivacy: boolean;
  setAgreePrivacy: (v: boolean) => void;
  error: string | null;
  loading: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  getErrorDisplay: (err: string | null) => string | null;
  t: (key: string) => string;
  inputClass: string;
  textareaClass: string;
  labelClass: string;
};

/** 向导注册表单区块（从 register/page 拆出，便于维护与单文件 ≤400 行） */
export default function RegisterGuideForm({
  mainClassName = registerPageShellClass("guideForm"),
  backdropKind = "guide",
  loginHref,
  autoFocusAccountEmail = true,
  email,
  setEmail,
  nickname,
  setNickname,
  password,
  setPassword,
  passwordConfirm,
  setPasswordConfirm,
  realName,
  setRealName,
  idNumber,
  setIdNumber,
  walletAddress,
  setWalletAddress,
  city,
  setCity,
  countryCode,
  setCountryCode,
  languages,
  setLanguages,
  serviceTypes,
  setServiceTypes,
  bio,
  setBio,
  idPhotoFile,
  setIdPhotoFile,
  languageCertFile,
  setLanguageCertFile,
  agreePrivacy,
  setAgreePrivacy,
  error,
  loading,
  onBack,
  onSubmit,
  getErrorDisplay,
  t,
  inputClass,
  textareaClass,
  labelClass,
}: RegisterGuideFormProps) {
  const formErrorId = useId();
  const guideTwoStepCalloutId = useId();
  const fid = useId();
  const emailInputId = `${fid}-email`;
  const nicknameInputId = `${fid}-nickname`;
  const passwordInputId = `${fid}-password`;
  const passwordConfirmInputId = `${fid}-password-confirm`;
  const idNumberInputId = `${fid}-id-number`;
  const idPhotoInputId = `${fid}-id-photo`;
  const languageCertInputId = `${fid}-language-cert`;
  const realNameInputId = `${fid}-real-name`;
  const walletAddressInputId = `${fid}-wallet`;
  const cityInputId = `${fid}-city`;
  const countryCodeInputId = `${fid}-country`;
  const languagesInputId = `${fid}-languages`;
  const serviceTypesInputId = `${fid}-service-types`;
  const bioInputId = `${fid}-bio`;
  const agreePrivacyInputId = `${fid}-agree-privacy`;
  const footerLinkClass = `${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`;
  const fieldWrapClass = "flex min-w-0 flex-col gap-1.5";
  return (
    <main
      className={mainClassName}
      aria-label={t("auth_register_guide")}
      data-tt-auth-root="1"
      data-tt-auth-route="register"
      data-tt-auth-surface="register_form_shell"
      data-tt-auth-register-role="guide"
    >
      <RegisterPageBackdrop kind={backdropKind} />
      <div className="relative z-10 flex w-full min-w-0 flex-col items-center gap-6">
        <div className="mx-auto flex w-full min-w-0 max-w-lg flex-col gap-6 rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onBack();
            }}
          >
            <button
              type="submit"
              data-tt-auth-register-back="1"
              className={`inline-flex min-h-[44px] items-center px-1 text-meta text-ink-500 transition-colors hover:text-travel-500 motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
            >
              {t("auth_register_back")}
            </button>
          </form>
        </div>
        <h1 className="shrink-0 text-h4 font-semibold leading-snug text-ink-900">{t("auth_register_guide")}</h1>
        <p className="text-meta text-ink-600">{t("auth_register_guideDesc")}</p>
        <TrustGrowthMomentBanner moment="register" surface="auth" />

        <div
          id={guideTwoStepCalloutId}
          role="note"
          className="rounded-[var(--radius-sm)] border border-travel-300/50 bg-travel-500/10 px-3 py-2.5 text-meta leading-snug text-ink-800"
        >
          {t("auth_register_guide_two_step_callout")}
        </div>

        <form noValidate onSubmit={onSubmit} className="flex min-w-0 flex-col gap-5" data-tt-auth-surface="register_form_fields">
          <section className="flex min-w-0 flex-col gap-3">
            <h2 className="text-small font-semibold text-ink-800 border-b border-ink-200 pb-1">{t("auth_register_accountSection")}</h2>
            <div className={fieldWrapClass}>
              <label htmlFor={emailInputId} className={labelClass}>
                {t("auth_register_email")} *
              </label>
              <input
                id={emailInputId}
                type="email"
                autoFocus={autoFocusAccountEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder={t("auth_register_email")}
                autoComplete="email"
                aria-invalid={!!error}
                aria-describedby={error ? formErrorId : undefined}
              />
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={nicknameInputId} className={labelClass}>
                {t("auth_register_nickname")}
              </label>
              <input
                id={nicknameInputId}
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={inputClass}
                autoComplete="nickname"
              />
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={passwordInputId} className={labelClass}>
                {t("auth_register_password")} *
              </label>
              <input
                id={passwordInputId}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
                placeholder={t("auth_register_passwordPlaceholder")}
                autoComplete="new-password"
              />
              {(() => {
                if (!password) return null;
                const s = passwordStrength(password);
                if (!s.labelKey) return null;
                return (
                  <p className={`text-meta mt-0.5 ${s.ok ? "text-ink-500" : "text-warning"}`}>{t(s.labelKey)}</p>
                );
              })()}
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={passwordConfirmInputId} className={labelClass}>
                {t("auth_register_confirmPassword")} *
              </label>
              <input
                id={passwordConfirmInputId}
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                className={inputClass}
                placeholder={t("auth_register_confirmPlaceholder")}
                autoComplete="new-password"
              />
            </div>
          </section>

          <section className="flex min-w-0 flex-col gap-3">
            <h2 className="text-small font-semibold text-ink-800 border-b border-ink-200 pb-1">{t("auth_register_didSection")}</h2>
            <div className={fieldWrapClass}>
              <label htmlFor={idNumberInputId} className={labelClass}>
                {t("auth_register_idNumber")}
              </label>
              <input
                id={idNumberInputId}
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                required
                className={inputClass}
                placeholder={t("auth_register_idNumber")}
              />
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={idPhotoInputId} className={labelClass}>
                {t("auth_register_idPhoto")}
              </label>
              <input
                id={idPhotoInputId}
                type="file"
                accept={ACCEPT_ID}
                onChange={(e) => setIdPhotoFile(e.target.files?.[0] ?? null)}
                className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-small text-ink-600 bg-bg-console file:mr-3 file:rounded file:border-0 file:bg-travel-500 file:px-2 file:py-1 file:text-small file:text-white ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              />
              <p className="text-meta text-ink-500 mt-0.5">{t("auth_register_idPhotoHint")}</p>
              {idPhotoFile && <p className="text-meta text-travel-600 mt-0.5">{idPhotoFile.name}</p>}
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={languageCertInputId} className={labelClass}>
                {t("auth_register_languageCert")}
              </label>
              <input
                id={languageCertInputId}
                type="file"
                accept={ACCEPT_LANG}
                onChange={(e) => setLanguageCertFile(e.target.files?.[0] ?? null)}
                className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-small text-ink-600 bg-bg-console file:mr-3 file:rounded file:border-0 file:bg-travel-500 file:px-2 file:py-1 file:text-small file:text-white ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              />
              <p className="text-meta text-ink-500 mt-0.5">{t("auth_register_languageCertOptional")}</p>
              {languageCertFile && <p className="text-meta text-travel-600 mt-0.5">{languageCertFile.name}</p>}
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={realNameInputId} className={labelClass}>
                {t("auth_register_realName")}
              </label>
              <input
                id={realNameInputId}
                type="text"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                required
                className={inputClass}
                autoComplete="name"
              />
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={walletAddressInputId} className={labelClass}>
                {t("auth_register_walletAddress")}
              </label>
              <input
                id={walletAddressInputId}
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                required
                className={inputClass}
                placeholder={t("auth_register_placeholder_wallet")}
              />
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={cityInputId} className={labelClass}>
                {t("auth_register_city")}
              </label>
              <input
                id={cityInputId}
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className={inputClass}
                autoComplete="address-level2"
              />
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={countryCodeInputId} className={labelClass}>
                {t("auth_register_countryCode")}
              </label>
              <input
                id={countryCodeInputId}
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className={inputClass}
                placeholder={t("auth_register_placeholder_countryCode")}
                autoComplete="country"
              />
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={languagesInputId} className={labelClass}>
                {t("auth_register_languages")}
              </label>
              <input
                id={languagesInputId}
                type="text"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className={inputClass}
                placeholder={t("auth_register_placeholder_languages")}
              />
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={serviceTypesInputId} className={labelClass}>
                {t("auth_register_serviceTypes")}
              </label>
              <input
                id={serviceTypesInputId}
                type="text"
                value={serviceTypes}
                onChange={(e) => setServiceTypes(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className={fieldWrapClass}>
              <label htmlFor={bioInputId} className={labelClass}>
                {t("auth_register_bio")}
              </label>
              <textarea id={bioInputId} value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={textareaClass} />
            </div>
            <label htmlFor={agreePrivacyInputId} className="flex cursor-pointer items-start gap-2">
              <input
                id={agreePrivacyInputId}
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-1 rounded-[var(--radius-sm)] border-ink-300"
              />
              <span className="text-meta text-ink-600">
                {t("auth_register_agreePrefix")}
                <Link href="/terms" className={footerLinkClass}>
                  {t("auth_register_agreeTerms")}
                </Link>
                {t("auth_register_agreeAnd")}
                <Link href="/privacy" className={footerLinkClass}>
                  {t("auth_register_agreePrivacyLink")}
                </Link>
                {t("auth_register_agreeSuffix")}
              </span>
            </label>
          </section>

          {error && (
            <p id={formErrorId} className="text-danger text-small whitespace-pre-line" role="alert" data-tt-auth-surface="register_form_error">
              {getErrorDisplay(error)}
            </p>
          )}
          <button
            type="submit"
            data-tt-auth-register-submit="1"
            disabled={loading}
            aria-busy={loading ? true : undefined}
            aria-describedby={guideTwoStepCalloutId}
            className={`btn-console inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-3 py-2 text-small font-medium text-white transition-colors motion-reduce:transition-none disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {loading ? t("auth_register_submitting") : t("auth_register_guideSubmit")}
          </button>
        </form>

        <p className="text-meta text-ink-500">
          <Link href={loginHref} className={footerLinkClass}>
            {t("auth_register_loginLink")}
          </Link>{" "}
          ·{" "}
          <Link href="/" className={footerLinkClass}>
            {t("auth_register_web3Travel")}
          </Link>
        </p>
        </div>
        <AuthShellCrossNav />
      </div>
    </main>
  );
}
