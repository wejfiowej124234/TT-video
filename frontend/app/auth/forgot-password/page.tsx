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

/** 与 HTML type=email 对齐的轻量校验；复杂 RFC 校验交给后端 `invalid_email`。 */
function isPlausibleEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** 忘记密码（POST /auth/forgot-password）；04 §三 3.1。51-H2：鉴权 stub，待 51-B1 真实实现（邮件/令牌）。 */
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailInputId = useId();
  const formErrorId = useId();

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
      >
        <div className={cardClass}>
          <h1 className="text-h4 font-semibold text-ink-900">{t("auth_forgot_title")}</h1>
          <p className="text-small text-ink-600" role="status" aria-live="polite">
            {t("auth_forgot_sentMessage")}
          </p>
          <p className="text-meta text-ink-500">
            <Link href="/auth/login" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("auth_forgot_backLogin")}</Link> ·{" "}
            <Link href="/" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("auth_forgot_home")}</Link>
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
    >
      <div className={cardClass}>
        <h1 className="text-h4 font-semibold text-ink-900">{t("auth_forgot_title")}</h1>
        <form noValidate onSubmit={handleSubmit} className="space-y-3">
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
            aria-label={t("auth_forgot_emailPlaceholder")}
            aria-invalid={!!error}
            aria-errormessage={error ? formErrorId : undefined}
            className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          />
          {error && <p id={formErrorId} className="text-danger text-small" role="alert">{error}</p>}
          <button type="submit" disabled={loading} aria-busy={loading ? true : undefined} className={`btn-console w-full rounded-[var(--radius-sm)] bg-travel-500 text-white py-2 text-small font-medium disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}>{loading ? t("auth_forgot_submitting") : t("auth_forgot_sendLink")}</button>
        </form>
        <p className="text-meta text-ink-500">
          <Link href="/auth/login" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("auth_forgot_backLogin")}</Link> ·{" "}
          <Link href="/" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("auth_forgot_home")}</Link>
        </p>
      </div>
      <AuthShellCrossNav />
    </main>
  );
}
