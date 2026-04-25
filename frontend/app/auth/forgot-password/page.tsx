"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { postForgotPassword } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useTranslation } from "@/components/LocaleProvider";
import AuthShellCrossNav from "@/components/auth/AuthShellCrossNav";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { AUTH_LOGIN_RETURN_HOME } from "@/lib/headerLoginHref";

/** 与 HTML type=email 对齐的轻量校验；复杂 RFC 校验交给后端 `invalid_email`。 */
function isPlausibleEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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
  const footerLinkClass = `${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`;

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

  const cardClass = "w-full max-w-sm rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6 space-y-4";
  if (sent) {
    return (
      <main
        className="min-h-screen bg-bg-main flex flex-col items-center justify-center gap-4 p-6 py-10"
        aria-label={t("auth_forgot_title")}
        data-tt-auth-root="1"
        data-tt-auth-route="forgot-password"
        data-tt-auth-surface="forgot_sent"
      >
        <div className={cardClass}>
          <h1 className="text-h4 font-semibold text-ink-900">{t("auth_forgot_title")}</h1>
          <p className="text-small text-ink-600" role="status" aria-live="polite">
            {t("auth_forgot_sentMessage")}
          </p>
          <p className="text-meta text-ink-500">
            <Link href={AUTH_LOGIN_RETURN_HOME} className={footerLinkClass}>{t("auth_forgot_backLogin")}</Link> ·{" "}
            <Link href="/" className={footerLinkClass}>{t("auth_forgot_home")}</Link>
          </p>
        </div>
        <AuthShellCrossNav />
      </main>
    );
  }
  return (
    <main
      className="min-h-screen bg-bg-main flex flex-col items-center justify-center gap-4 p-6 py-10"
      aria-label={t("auth_forgot_title")}
      data-tt-auth-root="1"
      data-tt-auth-route="forgot-password"
      data-tt-auth-surface="forgot_form"
    >
      <div className={cardClass}>
        <h1 className="text-h4 font-semibold text-ink-900">{t("auth_forgot_title")}</h1>
        <form noValidate onSubmit={handleSubmit} className="space-y-3" data-tt-auth-surface="forgot_form_fields">
          <div>
            <label htmlFor={emailInputId} className="mb-0.5 block text-meta text-ink-600">
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
              className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            />
          </div>
          {error && <p id={formErrorId} className="text-danger text-small" role="alert" data-tt-auth-surface="forgot_form_error">{error}</p>}
          <button
            type="submit"
            data-tt-auth-forgot-submit="1"
            disabled={loading}
            aria-busy={loading ? true : undefined}
            className={`btn-console inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-3 py-2 text-small font-medium text-white transition-colors motion-reduce:transition-none disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {loading ? t("auth_forgot_submitting") : t("auth_forgot_sendLink")}
          </button>
        </form>
        <p className="text-meta text-ink-500">
          <Link href={AUTH_LOGIN_RETURN_HOME} className={footerLinkClass}>{t("auth_forgot_backLogin")}</Link> ·{" "}
          <Link href="/" className={footerLinkClass}>{t("auth_forgot_home")}</Link>
        </p>
      </div>
      <AuthShellCrossNav />
    </main>
  );
}
