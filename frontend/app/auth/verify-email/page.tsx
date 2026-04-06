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

const cardClass =
  "w-full max-w-sm rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6 space-y-4";

/** 成功态单独渲染：无 token 输入、无 `role="alert"` 表单错误区 */
function VerifyEmailSuccessView({ t }: { t: (key: string) => string }) {
  return (
    <main
      className="min-h-screen bg-bg-main flex flex-col items-center justify-center gap-4 p-6 py-10"
      aria-label={t("auth_verify_title")}
    >
      <div className={cardClass}>
        <h1 className="text-h4 font-semibold text-ink-900">{t("auth_verify_title")}</h1>
        <p className="text-small text-ink-600" role="status" aria-live="polite">
          {t("auth_verify_doneMessage")}
        </p>
        <p className="text-meta text-ink-500">
          <Link href="/auth/login" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("auth_verify_goLogin")}
          </Link>{" "}
          ·{" "}
          <Link href="/" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("auth_forgot_home")}
          </Link>
        </p>
      </div>
      <AuthShellCrossNav />
    </main>
  );
}

/** 邮箱验证（POST /auth/verify-email）；04 §三 3.1。51-H2：鉴权 stub，待 51-B1 真实实现。token/code 可从 query 取。 */
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
    >
      <div className={cardClass}>
        <h1 className="text-h4 font-semibold text-ink-900">{t("auth_verify_title")}</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
          aria-busy={loading ? true : undefined}
        >
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
            aria-label={t("auth_verify_placeholder")}
            aria-invalid={!!error}
            aria-errormessage={error ? formErrorId : undefined}
            className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
          />
          {error && (
            <p id={formErrorId} className="text-danger text-small" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading ? true : undefined}
            className={`btn-console w-full rounded-[var(--radius-sm)] bg-travel-500 text-white py-2 text-small font-medium disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {loading ? t("auth_verify_submitting") : t("auth_verify_submit")}
          </button>
        </form>
        <p className="text-meta text-ink-500">
          <Link href="/auth/login" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("auth_verify_backLogin")}
          </Link>{" "}
          ·{" "}
          <Link href="/" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
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
    <AuthFullBleedSearchParamsSuspense mainAriaLabelKey="auth_verify_title">
      <VerifyEmailInner />
    </AuthFullBleedSearchParamsSuspense>
  );
}
