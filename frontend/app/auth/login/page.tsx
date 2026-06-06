"use client";

import { useState, useEffect, useId, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  postLogin,
  postSeedTestAccounts,
  applyClientSessionAfterAuth,
} from "@/lib/apiClient";
import { syncClientSessionUserIdCookieFromStorage } from "@/lib/apiClient/auth/sessionSideEffects";
import {
  hasAccountSessionCredentials,
  probeAccountLoggedInViaGetMe,
} from "@/lib/auth/accountSessionProbe";
import {
  isExpectedAuthLoginErrorMessage,
  mapAuthLoginSubmitError,
} from "@/lib/mapAuthLoginSubmitError";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5Checkbox from "@/components/auth/AuthL5Checkbox";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AuthLoginSearchParamsSuspense } from "@/components/auth/AuthSearchParamsSuspense";
import { resolvePostAuthReturnPath } from "@/lib/auth/postAuthReturnPath";
import { AUTH_LOGIN_REMEMBER_EMAIL_KEY, TT_AUTH_LOGIN_L5 } from "@/lib/auth/loginL5";
import { authL5FieldClass, TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import LoginPasswordVisibilityToggle from "./LoginPasswordVisibilityToggle";

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrlParam = searchParams.get("returnUrl");
  const returnUrl = resolvePostAuthReturnPath(returnUrlParam);
  const registerFromLoginHref = useMemo(() => {
    const next = resolvePostAuthReturnPath(returnUrlParam);
    return `/auth/register?returnUrl=${encodeURIComponent(next)}`;
  }, [returnUrlParam]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formErrorId = useId();
  const emailInputId = useId();
  const passwordInputId = useId();
  const rememberEmailId = useId();
  const footerLinkClass = `${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`;
  const fieldInvalid = !!error;
  const inputClass = authL5FieldClass(fieldInvalid);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_LOGIN_REMEMBER_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberEmail(true);
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (!hasAccountSessionCredentials()) return;
    let cancelled = false;
    syncClientSessionUserIdCookieFromStorage();
    void probeAccountLoggedInViaGetMe().then((ok) => {
      if (cancelled || !ok) return;
      void router.replace(returnUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [returnUrl, router]);

  useEffect(() => {
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
      try {
        if (rememberEmail) {
          localStorage.setItem(AUTH_LOGIN_REMEMBER_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(AUTH_LOGIN_REMEMBER_EMAIL_KEY);
        }
      } catch {
        /* noop */
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
    <AuthL5Card
      surface="login_l5_card"
      className="!max-w-[26rem]"
      bodyClassName={TT_AUTH_L5_FORM.cardBodyLogin}
    >
      <header className={TT_AUTH_L5_FORM.headerBlock}>
        <p className={TT_AUTH_L5_FORM.eyebrow}>{t("auth_login_eyebrow")}</p>
        <h1 className={TT_AUTH_L5_FORM.titleLogin}>{t("auth_login_title")}</h1>
        <p className={TT_AUTH_L5_FORM.subtitle}>{t("auth_login_subtitle")}</p>
      </header>
      <p
        className={`${TT_AUTH_L5_FORM.callout} ${TT_AUTH_L5_FORM.walletHint}`}
        data-tt-auth-surface="login_wallet_hint"
      >
        {t("auth_login_walletHintPrefix")}{" "}
        <span className={TT_AUTH_L5_FORM.calloutStrong}>{t("auth_login_walletHintAction")}</span>
        {t("auth_login_walletHintSuffix")}
      </p>
      <div className={TT_AUTH_L5_FORM.formSection}>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
          aria-describedby={error ? formErrorId : undefined}
          aria-busy={loading ? true : undefined}
          data-tt-auth-surface="login_form"
        >
          <div className={TT_AUTH_L5_FORM.fieldGroup}>
            <label htmlFor={emailInputId} className={TT_AUTH_L5_FORM.label}>
              {t("auth_login_email")}
            </label>
            <input
              id={emailInputId}
              type="email"
              placeholder={t("auth_login_emailPlaceholder")}
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
              className={inputClass}
            />
          </div>
          <div className={TT_AUTH_L5_FORM.fieldGroup}>
            <label htmlFor={passwordInputId} className={TT_AUTH_L5_FORM.label}>
              {t("auth_login_password")}
            </label>
            <div className={TT_AUTH_L5_FORM.passwordFieldWrap}>
              <input
                id={passwordInputId}
                type={passwordVisible ? "text" : "password"}
                placeholder={t("auth_login_passwordPlaceholder")}
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
                className={`${inputClass} pr-11`}
              />
              <LoginPasswordVisibilityToggle
                visible={passwordVisible}
                onToggle={() => setPasswordVisible((v) => !v)}
                showLabel={t("auth_login_passwordShow")}
                hideLabel={t("auth_login_passwordHide")}
                disabled={loading}
              />
            </div>
          </div>
          <AuthL5Checkbox
            id={rememberEmailId}
            checked={rememberEmail}
            onChange={setRememberEmail}
            disabled={loading}
            label={t("auth_login_rememberEmail")}
          />
          {error ? (
            <p
              id={formErrorId}
              className={TT_AUTH_L5_FORM.error}
              role="alert"
              data-tt-auth-surface="login_form_error"
            >
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            data-tt-auth-login-submit="1"
            disabled={loading}
            aria-busy={loading ? true : undefined}
            className={TT_AUTH_L5_FORM.primaryCtaLogin}
          >
            {loading ? (
              <>
                <span className={TT_AUTH_L5_FORM.primaryCtaSpinner} aria-hidden />
                {t("auth_login_submitting")}
              </>
            ) : (
              t("auth_login_submit")
            )}
          </button>
        </form>
        <nav
          className={TT_AUTH_L5_FORM.footerDivider}
          aria-label={t("auth_login_footerNav_aria")}
          data-tt-auth-surface="login_footer_links"
        >
          <div className={TT_AUTH_L5_FORM.footerMeta}>
            <Link href={registerFromLoginHref} className={footerLinkClass}>
              {t("auth_login_register")}
            </Link>
            <Link href="/auth/forgot-password" className={footerLinkClass}>
              {t("auth_login_forgotPassword")}
            </Link>
          </div>
        </nav>
      </div>
    </AuthL5Card>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <main
      className={TT_AUTH_LOGIN_L5.pageShell}
      aria-label={t("auth_login_title")}
      data-tt-auth-root="1"
      data-tt-auth-route="login"
      data-tt-auth-visual="l5"
      data-tt-auth-login-ui-frozen="1"
    >
      <AuthL5PageBackdrop />
      <div className={TT_AUTH_LOGIN_L5.pageColumn}>
        <AuthLoginSearchParamsSuspense>
          <LoginForm />
        </AuthLoginSearchParamsSuspense>
        <AuthL5CrossNavFooter />
      </div>
    </main>
  );
}
