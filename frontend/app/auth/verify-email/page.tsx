"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { postVerifyEmail } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useTranslation } from "@/components/LocaleProvider";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5FlowPage from "@/components/auth/AuthL5FlowPage";
import { AuthFullBleedSearchParamsSuspense } from "@/components/auth/AuthSearchParamsSuspense";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { authL5FieldClass, TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { MeSettingsResendVerifyEmailPanel } from "@/components/me/MeSettingsResendVerifyEmailPanel";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";
import { AUTH_LOGIN_RETURN_HOME } from "@/lib/headerLoginHref";

function VerifyEmailFooterLinks({
  t,
  fromSettings,
}: {
  t: (key: string) => string;
  fromSettings: boolean;
}) {
  const footerLinkClass = `${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`;
  return (
    <p className={TT_AUTH_L5_FORM.footerMeta}>
      {fromSettings ? (
        <>
          <Link href={ME_SETTINGS_HUB_PATH} className={footerLinkClass}>
            {t("me_settings_verify_back_settings")}
          </Link>
          <span className="text-ref-sun/30" aria-hidden>
            ·
          </span>
        </>
      ) : null}
      <Link href={AUTH_LOGIN_RETURN_HOME} className={footerLinkClass}>
        {t("auth_verify_backLogin")}
      </Link>
      <span className="text-ref-sun/30" aria-hidden>
        ·
      </span>
      <Link href="/" className={footerLinkClass}>
        {t("auth_forgot_home")}
      </Link>
    </p>
  );
}

function VerifyEmailPageShell({
  fromSettings,
  ariaLabel,
  t,
  children,
}: {
  fromSettings: boolean;
  ariaLabel: string;
  t: (key: string) => string;
  children: React.ReactNode;
}) {
  if (fromSettings) {
    return (
      <MeSettingsL5FlowPage
        route="settings-verify-email"
        ariaLabel={ariaLabel}
        dataAttrs={{
          "data-tt-me-settings-route": "verify-email",
          "data-tt-auth-verify-from-settings": "1",
        }}
        showMinimalFooter={false}
      >
        <MeSettingsHubBackLink t={t} />
        {children}
      </MeSettingsL5FlowPage>
    );
  }
  return (
    <AuthL5FlowPage route="verify-email" ariaLabel={ariaLabel}>
      {children}
    </AuthL5FlowPage>
  );
}

function VerifyEmailSuccessView({
  t,
  fromSettings,
}: {
  t: (key: string) => string;
  fromSettings: boolean;
}) {
  const router = useRouter();
  return (
    <VerifyEmailPageShell fromSettings={fromSettings} ariaLabel={t("auth_verify_title")} t={t}>
      <div data-tt-auth-surface="verify_done" data-tt-auth-verify-email-done="1">
        <AuthL5Card surface="verify_l5_card">
          <h1 className={TT_AUTH_L5_FORM.titleCompact}>{t("auth_verify_title")}</h1>
          <p className={TT_AUTH_L5_FORM.bodyText} role="status" aria-live="polite">
            {t("auth_verify_doneMessage")}
          </p>
          {fromSettings ? (
            <Link
              href={ME_SETTINGS_HUB_PATH}
              className={`${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.primaryCta}`}
              onClick={() => router.refresh()}
            >
              {t("me_settings_verify_back_settings")}
            </Link>
          ) : (
            <p className={TT_AUTH_L5_FORM.footerMeta}>
              <Link
                href={AUTH_LOGIN_RETURN_HOME}
                className={`${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`}
              >
                {t("auth_verify_goLogin")}
              </Link>
              <span className="text-ref-sun/30" aria-hidden>
                ·
              </span>
              <Link href="/" className={`${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`}>
                {t("auth_forgot_home")}
              </Link>
            </p>
          )}
        </AuthL5Card>
      </div>
    </VerifyEmailPageShell>
  );
}

/** 邮箱验证（POST /auth/verify-email）；`token`/`code` 可从邮件链接 query 或手动粘贴。 */
function VerifyEmailInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const fromSettings = searchParams.get("from") === "settings";
  const qToken = searchParams.get("token") ?? searchParams.get("code") ?? "";
  const [token, setToken] = useState(qToken);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const tokenInputId = useId();
  const formErrorId = useId();
  const fieldInvalid = !!error;
  const inputClass = authL5FieldClass(fieldInvalid);

  useEffect(() => {
    setToken(qToken);
    setError(null);
  }, [qToken]);

  useEffect(() => {
    if (!verified) return;
    setError(null);
    setLoading(false);
  }, [verified]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = token.trim();
    if (!trimmed) {
      setError(t("auth_verify_token_required"));
      return;
    }
    setLoading(true);
    try {
      await postVerifyEmail({ token: trimmed });
      setError(null);
      setVerified(true);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("VerifyEmail:", err);
      }
      setVerified(false);
      setError(mapApiReadError(err, t, "auth_verify_failed"));
    } finally {
      setLoading(false);
    }
  }

  if (verified) {
    return <VerifyEmailSuccessView t={t} fromSettings={fromSettings} />;
  }

  return (
    <VerifyEmailPageShell fromSettings={fromSettings} ariaLabel={t("auth_verify_title")} t={t}>
      <div data-tt-auth-surface="verify_form">
        <AuthL5Card surface="verify_l5_card">
          <h1 className={TT_AUTH_L5_FORM.titleCompact}>{t("auth_verify_title")}</h1>
          {fromSettings ? <MeSettingsResendVerifyEmailPanel onDevToken={(tkn) => setToken(tkn)} /> : null}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            aria-busy={loading ? true : undefined}
            data-tt-auth-surface="verify_form_fields"
          >
            <div className={TT_AUTH_L5_FORM.fieldGroup}>
              <label htmlFor={tokenInputId} className={TT_AUTH_L5_FORM.label}>
                {t("auth_verify_token_label")}
              </label>
              <input
                type="text"
                id={tokenInputId}
                placeholder={t("auth_verify_placeholder")}
                value={token}
                onChange={(e) => {
                  setError(null);
                  setToken(e.target.value);
                }}
                disabled={loading}
                autoComplete="one-time-code"
                aria-invalid={!!error}
                aria-errormessage={error ? formErrorId : undefined}
                className={inputClass}
              />
            </div>
            {error ? (
              <p
                id={formErrorId}
                className={TT_AUTH_L5_FORM.error}
                role="alert"
                data-tt-auth-surface="verify_form_error"
              >
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              data-tt-auth-verify-email-submit="1"
              disabled={loading}
              aria-busy={loading ? true : undefined}
              className={TT_AUTH_L5_FORM.primaryCta}
            >
              {loading ? t("auth_verify_submitting") : t("auth_verify_submit")}
            </button>
          </form>
          <VerifyEmailFooterLinks t={t} fromSettings={fromSettings} />
        </AuthL5Card>
      </div>
    </VerifyEmailPageShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthFullBleedSearchParamsSuspense mainAriaLabelKey="auth_verify_title">
      <VerifyEmailInner />
    </AuthFullBleedSearchParamsSuspense>
  );
}
