"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { postForgotPassword } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useTranslation } from "@/components/LocaleProvider";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5FlowPage from "@/components/auth/AuthL5FlowPage";
import { authL5FieldClass, TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AUTH_LOGIN_RETURN_HOME } from "@/lib/headerLoginHref";

/** 与 HTML type=email 对齐的轻量校验；复杂 RFC 校验交给后端 `invalid_email`。 */
function isPlausibleEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function ForgotPasswordFooterLinks({ t }: { t: (key: string) => string }) {
  const footerLinkClass = `${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`;
  return (
    <p className={TT_AUTH_L5_FORM.footerMeta}>
      <Link href={AUTH_LOGIN_RETURN_HOME} className={footerLinkClass}>
        {t("auth_forgot_backLogin")}
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

/** 忘记密码（POST /auth/forgot-password）；04 §三 3.1。成功响应后提示用户查收邮件（`auth_forgot_sentMessage`）。 */
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailInputId = useId();
  const formErrorId = useId();
  const fieldInvalid = !!error;
  const inputClass = authL5FieldClass(fieldInvalid);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const emailTrim = email.trim();
    if (!emailTrim) {
      setError(t("auth_forgot_emailRequired"));
      return;
    }
    if (!isPlausibleEmail(emailTrim)) {
      setError(t("auth_forgot_error_invalidEmail"));
      return;
    }
    setLoading(true);
    try {
      await postForgotPassword({ email: emailTrim });
      setSent(true);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("ForgotPassword:", err);
      }
      setError(mapApiReadError(err, t, "auth_forgot_requestFailed"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthL5FlowPage route="forgot-password" ariaLabel={t("auth_forgot_title")}>
        <div data-tt-auth-surface="forgot_sent">
          <AuthL5Card surface="forgot_l5_card">
            <h1 className={TT_AUTH_L5_FORM.titleCompact}>{t("auth_forgot_title")}</h1>
            <p className={TT_AUTH_L5_FORM.bodyText} role="status" aria-live="polite">
              {t("auth_forgot_sentMessage")}
            </p>
            <ForgotPasswordFooterLinks t={t} />
          </AuthL5Card>
        </div>
      </AuthL5FlowPage>
    );
  }

  return (
    <AuthL5FlowPage route="forgot-password" ariaLabel={t("auth_forgot_title")}>
      <div data-tt-auth-surface="forgot_form">
        <AuthL5Card surface="forgot_l5_card">
          <h1 className={TT_AUTH_L5_FORM.titleCompact}>{t("auth_forgot_title")}</h1>
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4" data-tt-auth-surface="forgot_form_fields">
            <div className={TT_AUTH_L5_FORM.fieldGroup}>
              <label htmlFor={emailInputId} className={TT_AUTH_L5_FORM.label}>
                {t("auth_forgot_emailLabel")}
              </label>
              <input
                type="email"
                id={emailInputId}
                placeholder={t("auth_forgot_emailPlaceholder")}
                value={email}
                onChange={(e) => {
                  setError(null);
                  setEmail(e.target.value);
                }}
                required
                autoComplete="email"
                aria-invalid={!!error}
                aria-errormessage={error ? formErrorId : undefined}
                className={inputClass}
              />
            </div>
            {error ? (
              <p id={formErrorId} className={TT_AUTH_L5_FORM.error} role="alert" data-tt-auth-surface="forgot_form_error">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              data-tt-auth-forgot-submit="1"
              disabled={loading}
              aria-busy={loading ? true : undefined}
              className={TT_AUTH_L5_FORM.primaryCta}
            >
              {loading ? t("auth_forgot_submitting") : t("auth_forgot_sendLink")}
            </button>
          </form>
          <ForgotPasswordFooterLinks t={t} />
        </AuthL5Card>
      </div>
    </AuthL5FlowPage>
  );
}
