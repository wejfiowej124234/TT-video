"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { postVerifyEmail } from "@/lib/apiClient";
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

const authShellFooterLinkClass = `${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`;

const cardClass =
  "w-full max-w-sm rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6 space-y-4";

/** 成功态单独渲染：无 token 输入、无 `role="alert"` 表单错误区 */
function VerifyEmailSuccessView({ t }: { t: (key: string) => string }) {
  return (
    <main
      className="min-h-screen bg-bg-main flex flex-col items-center justify-center gap-4 p-6 py-10"
      aria-label={t("auth_verify_title")}
      data-tt-auth-root="1"
      data-tt-auth-route="verify-email"
      data-tt-auth-surface="verify_done"
    >
      <div className={cardClass}>
        <h1 className="text-h4 font-semibold text-ink-900">{t("auth_verify_title")}</h1>
        <p className="text-small text-ink-600" role="status" aria-live="polite">
          {t("auth_verify_doneMessage")}
        </p>
        <p className="text-meta text-ink-500">
          <Link href={AUTH_LOGIN_RETURN_HOME} className={authShellFooterLinkClass}>
            {t("auth_verify_goLogin")}
          </Link>{" "}
          ·{" "}
          <Link href="/" className={authShellFooterLinkClass}>
            {t("auth_forgot_home")}
          </Link>
        </p>
      </div>
      <AuthShellCrossNav />
    </main>
  );
}

/** 邮箱验证（POST /auth/verify-email）；04 §三 3.1。`token`/`code` 可从邮件链接 query 或手动粘贴。 */
function VerifyEmailInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const qToken = searchParams.get("token") ?? searchParams.get("code") ?? "";
  const [token, setToken] = useState(qToken);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const tokenInputId = useId();
  const formErrorId = useId();

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
    return <VerifyEmailSuccessView t={t} />;
  }
  return (
    <main
      className="min-h-screen bg-bg-main flex flex-col items-center justify-center gap-4 p-6 py-10"
      aria-label={t("auth_verify_title")}
      data-tt-auth-root="1"
      data-tt-auth-route="verify-email"
      data-tt-auth-surface="verify_form"
    >
      <div className={cardClass}>
        <h1 className="text-h4 font-semibold text-ink-900">{t("auth_verify_title")}</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
          aria-busy={loading ? true : undefined}
          data-tt-auth-surface="verify_form_fields"
        >
          <div>
            <label htmlFor={tokenInputId} className="mb-0.5 block text-meta text-ink-600">
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
              className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
            />
          </div>
          {error && (
            <p id={formErrorId} className="text-danger text-small" role="alert" data-tt-auth-surface="verify_form_error">
              {error}
            </p>
          )}
          <button
            type="submit"
            data-tt-auth-verify-email-submit="1"
            disabled={loading}
            aria-busy={loading ? true : undefined}
            className={`btn-console inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-3 py-2 text-small font-medium text-white transition-colors motion-reduce:transition-none disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {loading ? t("auth_verify_submitting") : t("auth_verify_submit")}
          </button>
        </form>
        <p className="text-meta text-ink-500">
          <Link href={AUTH_LOGIN_RETURN_HOME} className={authShellFooterLinkClass}>
            {t("auth_verify_backLogin")}
          </Link>{" "}
          ·{" "}
          <Link href="/" className={authShellFooterLinkClass}>
            {t("auth_forgot_home")}
          </Link>
        </p>
      </div>
      <AuthShellCrossNav />
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthFullBleedSearchParamsSuspense mainAriaLabelKey="auth_verify_title" authAuditRoute="verify-email">
      <VerifyEmailInner />
    </AuthFullBleedSearchParamsSuspense>
  );
}
