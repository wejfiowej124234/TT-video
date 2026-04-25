"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { postResetPassword } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useTranslation } from "@/components/LocaleProvider";
import AuthShellCrossNav from "@/components/auth/AuthShellCrossNav";
import { AuthFullBleedSearchParamsSuspense } from "@/components/auth/AuthSearchParamsSuspense";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { AUTH_LOGIN_RETURN_HOME } from "@/lib/headerLoginHref";

const cardClass =
  "w-full max-w-sm rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6 space-y-4";

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
  const footerLinkClass = `${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`;

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
      <main
        className="min-h-screen bg-bg-main flex flex-col items-center justify-center gap-4 p-6 py-10"
        aria-label={t("auth_reset_title")}
        data-tt-auth-root="1"
        data-tt-auth-route="reset-password"
        data-tt-auth-surface="reset_done"
      >
        <div className={cardClass}>
          <h1 className="text-h4 font-semibold text-ink-900">{t("auth_reset_title")}</h1>
          <p className="text-small text-ink-600">{t("auth_reset_doneMessage")}</p>
          <p className="text-meta text-ink-500">
            <Link href={AUTH_LOGIN_RETURN_HOME} className={footerLinkClass}>
              {t("auth_reset_goLogin")}
            </Link>{" "}
            ·{" "}
            <Link href="/" className={footerLinkClass}>
              {t("auth_forgot_home")}
            </Link>
          </p>
        </div>
        <AuthShellCrossNav />
      </main>
    );
  }
  return (
    <main
      className="min-h-screen bg-bg-main flex flex-col items-center justify-center gap-4 p-6 py-10"
      aria-label={t("auth_reset_title")}
      data-tt-auth-root="1"
      data-tt-auth-route="reset-password"
      data-tt-auth-surface="reset_form"
    >
      <div className={cardClass}>
        <h1 className="text-h4 font-semibold text-ink-900">{t("auth_reset_title")}</h1>
        <p id={tokenHelpId} className="text-small text-ink-600">
          {t("auth_reset_token_help")}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3" aria-describedby={tokenHelpId} data-tt-auth-surface="reset_form_fields">
          <div>
            <label htmlFor={tokenInputId} className="block text-meta text-ink-600 mb-0.5">
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
              className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
            />
          </div>
          <div>
            <label htmlFor={newPasswordId} className="mb-0.5 block text-meta text-ink-600">
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
              className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
            />
          </div>
          <div>
            <label htmlFor={confirmPasswordId} className="mb-0.5 block text-meta text-ink-600">
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
              className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
            />
          </div>
          {error && (
            <p id={formErrorId} className="text-danger text-small" role="alert" data-tt-auth-surface="reset_form_error">
              {error}
            </p>
          )}
          <button
            type="submit"
            data-tt-auth-reset-submit="1"
            disabled={loading}
            aria-busy={loading ? true : undefined}
            className={`btn-console inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-3 py-2 text-small font-medium text-white transition-colors motion-reduce:transition-none disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {loading ? t("auth_reset_submitting") : t("auth_reset_submit")}
          </button>
        </form>
        <p className="text-meta text-ink-500">
          <Link href={AUTH_LOGIN_RETURN_HOME} className={footerLinkClass}>
            {t("auth_reset_backLogin")}
          </Link>{" "}
          ·{" "}
          <Link href="/" className={footerLinkClass}>
            {t("auth_forgot_home")}
          </Link>
        </p>
      </div>
      <AuthShellCrossNav />
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthFullBleedSearchParamsSuspense mainAriaLabelKey="auth_reset_title" authAuditRoute="reset-password">
      <ResetPasswordInner />
    </AuthFullBleedSearchParamsSuspense>
  );
}
