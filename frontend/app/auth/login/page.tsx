"use client";

import { useState, useEffect, useId } from "react";
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
  const returnUrl = safeInternalReturnPath(searchParams.get("returnUrl"), "/community/me");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formErrorId = useId();

  useEffect(() => {
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
      setError(mapAuthLoginSubmitError(err, t));
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
      >
        <input
          type="email"
          placeholder={t("auth_login_email")}
          value={email}
          onChange={(e) => {
            setError(null);
            setEmail(e.target.value);
          }}
          required
          disabled={loading}
          aria-label={t("auth_login_email")}
          aria-invalid={!!error}
          aria-describedby={error ? formErrorId : undefined}
          className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
        />
        <input
          type="password"
          placeholder={t("auth_login_password")}
          value={password}
          onChange={(e) => {
            setError(null);
            setPassword(e.target.value);
          }}
          required
          disabled={loading}
          aria-label={t("auth_login_password")}
          aria-invalid={!!error}
          aria-describedby={error ? formErrorId : undefined}
          className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
        />
        {error && <p id={formErrorId} className="text-danger text-small" role="alert">{error}</p>}
        <button type="submit" disabled={loading} aria-busy={loading ? true : undefined} className={`btn-console w-full rounded-[var(--radius-sm)] bg-travel-500 text-white py-2 text-small font-medium disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}>
          {loading ? t("auth_login_submitting") : t("auth_login_submit")}
        </button>
      </form>
      <p className="text-meta text-ink-500">
        <Link href="/auth/register" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("auth_login_register")}</Link> ·{" "}
        <Link href="/auth/forgot-password" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("auth_login_forgotPassword")}</Link> ·{" "}
        <Link href="/" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("auth_login_web3Travel")}</Link>
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
    >
      <AuthLoginSearchParamsSuspense>
        <LoginForm />
      </AuthLoginSearchParamsSuspense>
      <AuthShellCrossNav />
    </main>
  );
}
