"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { postResetPassword } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useTranslation } from "@/components/LocaleProvider";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5FlowPage from "@/components/auth/AuthL5FlowPage";
import { AuthFullBleedSearchParamsSuspense } from "@/components/auth/AuthSearchParamsSuspense";
import { authL5FieldClass, TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AUTH_LOGIN_RETURN_HOME } from "@/lib/headerLoginHref";

function ResetPasswordFooterLinks({ t }: { t: (key: string) => string }) {
  const footerLinkClass = `${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`;
  return (
    <p className={TT_AUTH_L5_FORM.footerMeta}>
      <Link href={AUTH_LOGIN_RETURN_HOME} className={footerLinkClass}>
        {t("auth_reset_backLogin")}
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

/** 重置密码（POST /auth/reset-password）；04 §三 3.1。`token` 可来自邮件链接 query 或手动粘贴（与 `/auth/verify-email` 同源 UX）。 */
function ResetPasswordInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const qToken = searchParams.get("token") ?? "";
  const [token, setToken] = useState(qToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const tokenInputId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const formErrorId = useId();
  const tokenHelpId = useId();
  const fieldInvalid = !!error;
  const inputClass = authL5FieldClass(fieldInvalid);

  useEffect(() => {
    setToken(qToken);
    setError(null);
  }, [qToken]);

  const tokenTrimmed = token.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tokenTrimmed) {
      setError(t("auth_reset_token_required"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth_reset_passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await postResetPassword({ token: tokenTrimmed, new_password: newPassword });
      setDone(true);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("ResetPassword:", err);
      }
      setError(mapApiReadError(err, t, "auth_reset_failed"));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthL5FlowPage route="reset-password" ariaLabel={t("auth_reset_title")}>
        <div data-tt-auth-surface="reset_done">
          <AuthL5Card surface="reset_l5_card">
            <h1 className={TT_AUTH_L5_FORM.titleCompact}>{t("auth_reset_title")}</h1>
            <p className={TT_AUTH_L5_FORM.bodyText}>{t("auth_reset_doneMessage")}</p>
            <p className={TT_AUTH_L5_FORM.footerMeta}>
              <Link
                href={AUTH_LOGIN_RETURN_HOME}
                className={`${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`}
              >
                {t("auth_reset_goLogin")}
              </Link>
              <span className="text-ref-sun/30" aria-hidden>
                ·
              </span>
              <Link href="/" className={`${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`}>
                {t("auth_forgot_home")}
              </Link>
            </p>
          </AuthL5Card>
        </div>
      </AuthL5FlowPage>
    );
  }

  return (
    <AuthL5FlowPage route="reset-password" ariaLabel={t("auth_reset_title")}>
      <div data-tt-auth-surface="reset_form">
        <AuthL5Card surface="reset_l5_card">
          <h1 className={TT_AUTH_L5_FORM.titleCompact}>{t("auth_reset_title")}</h1>
          <p id={tokenHelpId} className={TT_AUTH_L5_FORM.subtitle}>
            {t("auth_reset_token_help")}
          </p>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            aria-describedby={tokenHelpId}
            data-tt-auth-surface="reset_form_fields"
          >
            <div className={TT_AUTH_L5_FORM.fieldGroup}>
              <label htmlFor={tokenInputId} className={TT_AUTH_L5_FORM.label}>
                {t("auth_reset_token_label")}
              </label>
              <input
                type="text"
                id={tokenInputId}
                placeholder={t("auth_reset_token_placeholder")}
                value={token}
                onChange={(e) => {
                  setError(null);
                  setToken(e.target.value);
                }}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={!!error}
                aria-errormessage={error ? formErrorId : undefined}
                data-tt-auth-reset-token-input="1"
                className={inputClass}
              />
            </div>
            <div className={TT_AUTH_L5_FORM.fieldGroup}>
              <label htmlFor={newPasswordId} className={TT_AUTH_L5_FORM.label}>
                {t("auth_reset_newPassword")}
              </label>
              <input
                type="password"
                id={newPasswordId}
                placeholder={t("auth_reset_newPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                aria-invalid={!!error}
                aria-errormessage={error ? formErrorId : undefined}
                className={inputClass}
              />
            </div>
            <div className={TT_AUTH_L5_FORM.fieldGroup}>
              <label htmlFor={confirmPasswordId} className={TT_AUTH_L5_FORM.label}>
                {t("auth_reset_confirmPassword")}
              </label>
              <input
                type="password"
                id={confirmPasswordId}
                placeholder={t("auth_reset_confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                aria-invalid={!!error}
                aria-errormessage={error ? formErrorId : undefined}
                className={inputClass}
              />
            </div>
            {error ? (
              <p id={formErrorId} className={TT_AUTH_L5_FORM.error} role="alert" data-tt-auth-surface="reset_form_error">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              data-tt-auth-reset-submit="1"
              disabled={loading}
              aria-busy={loading ? true : undefined}
              className={TT_AUTH_L5_FORM.primaryCta}
            >
              {loading ? t("auth_reset_submitting") : t("auth_reset_submit")}
            </button>
          </form>
          <ResetPasswordFooterLinks t={t} />
        </AuthL5Card>
      </div>
    </AuthL5FlowPage>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthFullBleedSearchParamsSuspense mainAriaLabelKey="auth_reset_title" authAuditRoute="reset-password">
      <ResetPasswordInner />
    </AuthFullBleedSearchParamsSuspense>
  );
}
