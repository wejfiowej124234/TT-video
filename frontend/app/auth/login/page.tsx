"use client";

import { useState, useEffect, useId, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { postLogin, postSeedTestAccounts, applyClientSessionAfterAuth } from "@/lib/apiClient";
import {
  isExpectedAuthLoginErrorMessage,
  mapAuthLoginSubmitError,
} from "@/lib/mapAuthLoginSubmitError";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import AuthShellCrossNav from "@/components/auth/AuthShellCrossNav";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { AuthLoginSearchParamsSuspense } from "@/components/auth/AuthSearchParamsSuspense";
import { safeInternalReturnPath } from "@/lib/safeInternalReturnPath";

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrlParam = searchParams.get("returnUrl");
  const returnUrl = safeInternalReturnPath(returnUrlParam, "/community/me");
  const registerFromLoginHref = useMemo(() => {
    const next = safeInternalReturnPath(returnUrlParam, "/community/me");
    return `/auth/register?returnUrl=${encodeURIComponent(next)}`;
  }, [returnUrlParam]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formErrorId = useId();
  const emailInputId = useId();
  const passwordInputId = useId();
  const footerLinkClass = `${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`;

  useEffect(() => {
    /**
     * 生产构建不调用：后端通常为 403，徒增噪声与 RTT。
     * 本地 / E2E：`POST /auth/seed-test-accounts`（与真实登录会话无关，见 `routes.auth.seedTestAccounts`）。
     */
    if (process.env.NODE_ENV === "production") return;
    postSeedTestAccounts()
      .then(() => {})
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("LoginForm postSeedTestAccounts:", err);
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await postLogin({ email, password });
      const uid = applyClientSessionAfterAuth(res);
      if (!uid) {
        setError(t("auth_login_error_failed"));
        return;
      }
      await router.replace(returnUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (typeof window !== "undefined" && !isExpectedAuthLoginErrorMessage(msg)) {
        console.error("LoginForm:", err);
      }
      let message = mapAuthLoginSubmitError(err, t);
      if (process.env.NODE_ENV !== "production" && msg === "invalid_credentials") {
        message = `${message}\n\n${t("auth_login_error_devSeedHint")}`;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6 space-y-4">
      <h1 className="text-h4 font-semibold text-ink-900">{t("auth_login_title")}</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-3"
        aria-describedby={error ? formErrorId : undefined}
        aria-busy={loading ? true : undefined}
        data-tt-auth-surface="login_form"
      >
        <div>
          <label htmlFor={emailInputId} className="mb-0.5 block text-meta text-ink-600">
            {t("auth_login_email")}
          </label>
          <input
            id={emailInputId}
            type="email"
            placeholder={t("auth_login_email")}
            value={email}
            onChange={(e) => {
              setError(null);
              setEmail(e.target.value);
            }}
            required
            disabled={loading}
            autoComplete="email"
            aria-invalid={!!error}
            aria-describedby={error ? formErrorId : undefined}
            className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
          />
        </div>
        <div>
          <label htmlFor={passwordInputId} className="mb-0.5 block text-meta text-ink-600">
            {t("auth_login_password")}
          </label>
          <input
            id={passwordInputId}
            type="password"
            placeholder={t("auth_login_password")}
            value={password}
            onChange={(e) => {
              setError(null);
              setPassword(e.target.value);
            }}
            required
            disabled={loading}
            autoComplete="current-password"
            aria-invalid={!!error}
            aria-describedby={error ? formErrorId : undefined}
            className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
          />
        </div>
        {error && (
          <p id={formErrorId} className="text-danger text-small whitespace-pre-line" role="alert" data-tt-auth-surface="login_form_error">
            {error}
          </p>
        )}
        <button
          type="submit"
          data-tt-auth-login-submit="1"
          disabled={loading}
          aria-busy={loading ? true : undefined}
          className={`btn-console inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-3 py-2 text-small font-medium text-white transition-colors motion-reduce:transition-none disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
        >
          {loading ? t("auth_login_submitting") : t("auth_login_submit")}
        </button>
      </form>
      <p className="text-meta text-ink-500">
        <Link href={registerFromLoginHref} className={footerLinkClass}>{t("auth_login_register")}</Link> ·{" "}
        <Link href="/auth/forgot-password" className={footerLinkClass}>{t("auth_login_forgotPassword")}</Link> ·{" "}
        <Link href="/" className={footerLinkClass}>{t("auth_login_web3Travel")}</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <main
      className="min-h-screen bg-bg-main flex flex-col items-center justify-center gap-2 p-6 py-10"
      aria-label={t("auth_login_title")}
      data-tt-auth-root="1"
      data-tt-auth-route="login"
    >
      <AuthLoginSearchParamsSuspense>
        <LoginForm />
      </AuthLoginSearchParamsSuspense>
      <AuthShellCrossNav />
    </main>
  );
}
