"use client";

import Link from "next/link";
import { useId } from "react";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import AuthL5FormError from "@/components/auth/AuthL5FormError";
import { TT_AUTH_L5_PAGE_COLUMN } from "@/lib/auth/authL5Shell";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ACCEPT_ID, ACCEPT_LANG } from "./constants";
import { registerPageShellClass, type RegisterVisualKind } from "./registerBackgrounds";
import AuthL5Checkbox from "@/components/auth/AuthL5Checkbox";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import { passwordStrength } from "./utils";
import RegisterVerificationCodeField from "./RegisterVerificationCodeField";

export type RegisterGuideFormProps = {
  mainClassName?: string;
  backdropKind?: Exclude<RegisterVisualKind, "default">;
  loginHref: string;
  /** 进入本步时聚焦账号区邮箱 */
  autoFocusAccountEmail?: boolean;
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
  const verificationCodeInputId = `${fid}-verification-code`;
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
  const footerLinkClass = `${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`;
  const fieldWrapClass = TT_AUTH_L5_FORM.fieldGroup;
  return (
    <main
      className={mainClassName}
      aria-label={t("auth_register_guide")}
      data-tt-auth-root="1"
      data-tt-auth-route="register"
      data-tt-auth-surface="register_form_shell"
      data-tt-auth-register-role="guide"
      data-tt-auth-visual="l5"
      data-tt-auth-register-ui-frozen="1"
    >
      <AuthL5PageBackdrop />
      <div className={`${TT_AUTH_L5_PAGE_COLUMN} gap-6`}>
        <AuthL5Card maxWidth="wide" surface="register_l5_card">
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
        <header className={`${TT_AUTH_L5_FORM.headerBlock} pb-4`}>
          <h1 className={TT_AUTH_L5_FORM.titleLogin}>{t("auth_register_guide")}</h1>
          <p className={TT_AUTH_L5_FORM.subtitle}>{t("auth_register_guideDesc")}</p>
        </header>
        <TrustGrowthMomentBanner moment="register" surface="l5" preferCollapsedSummary />

        <div id={guideTwoStepCalloutId} role="note" className={TT_AUTH_L5_FORM.callout}>
          {t("auth_register_guide_two_step_callout")}
        </div>

        <form noValidate onSubmit={onSubmit} className="flex min-w-0 flex-col gap-5" data-tt-auth-surface="register_form_fields">
          <section className="flex min-w-0 flex-col gap-3">
            <h2 className={TT_AUTH_L5_FORM.sectionTitle}>{t("auth_register_accountSection")}</h2>
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
                  <p className={s.ok ? TT_AUTH_L5_FORM.passwordHintOk : TT_AUTH_L5_FORM.passwordHintWarn}>{t(s.labelKey)}</p>
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
            <h2 className={TT_AUTH_L5_FORM.sectionTitle}>{t("auth_register_didSection")}</h2>
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
                className={TT_AUTH_L5_FORM.fileInput}
              />
              <p className={TT_AUTH_L5_FORM.fileMeta}>{t("auth_register_idPhotoHint")}</p>
              {idPhotoFile ? <p className={TT_AUTH_L5_FORM.fileSelected}>{idPhotoFile.name}</p> : null}
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
                className={TT_AUTH_L5_FORM.fileInput}
              />
              <p className={TT_AUTH_L5_FORM.fileMeta}>{t("auth_register_languageCertOptional")}</p>
              {languageCertFile ? <p className={TT_AUTH_L5_FORM.fileSelected}>{languageCertFile.name}</p> : null}
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
            <AuthL5Checkbox
              id={agreePrivacyInputId}
              checked={agreePrivacy}
              onChange={setAgreePrivacy}
              asRow
              className={`${TT_AUTH_L5_FORM.rememberRow} items-start gap-2.5 mb-0 min-h-[44px]`}
              labelClassName={`${TT_AUTH_L5_FORM.agreeText} pt-0.5`}
              label={
                <>
                  {t("auth_register_agreePrefix")}
                  <Link href="/terms" className={footerLinkClass}>
                    {t("auth_register_agreeTerms")}
                  </Link>
                  {t("auth_register_agreeAnd")}
                  <Link href="/privacy" className={footerLinkClass}>
                    {t("auth_register_agreePrivacyLink")}
                  </Link>
                  {t("auth_register_agreeSuffix")}
                </>
              }
            />
          </section>

          {error ? (
            <AuthL5FormError id={formErrorId} message={getErrorDisplay(error)} surface="register_form_error" />
          ) : null}
          <button
            type="submit"
            data-tt-auth-register-submit="1"
            disabled={loading}
            aria-busy={loading ? true : undefined}
            aria-describedby={guideTwoStepCalloutId}
            className={TT_AUTH_L5_FORM.primaryCta}
          >
            {loading ? t("auth_register_submitting") : t("auth_register_guideSubmit")}
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
