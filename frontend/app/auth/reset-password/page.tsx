"use client";

import { useId, useState } from "react";
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

const cardClass =
  "w-full max-w-sm rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6 space-y-4";

/** 重置密码（POST /auth/reset-password）；04 §三 3.1。51-H2：鉴权 stub，待 51-B1 真实实现。token 可从 query 取。 */
function ResetPasswordInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const formErrorId = useId();
  const tokenMissingAlertId = useId();

  const tokenTrimmed = token.trim();
  const missingResetToken = tokenTrimmed.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (missingResetToken) {
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth_reset_passwordMismatch"));
      return;
    }
    setLoading(true);
    postResetPassword({ token: tokenTrimmed, new_password: newPassword })
      .then(() => {
        setDone(true);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("ResetPassword:", err);
        }
        setError(mapApiReadError(err, t, "auth_reset_failed"));
      })
      .finally(() => setLoading(false));
  };

  if (done) {
    return (
      <main
        className="min-h-screen bg-bg-main flex flex-col items-center justify-center gap-4 p-6 py-10"
        aria-label={t("auth_reset_title")}
      >
        <div className={cardClass}>
          <h1 className="text-h4 font-semibold text-ink-900">{t("auth_reset_title")}</h1>
          <p className="text-small text-ink-600">{t("auth_reset_doneMessage")}</p>
          <p className="text-meta text-ink-500">
            <Link href="/auth/login" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
              {t("auth_reset_goLogin")}
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
  return (
    <main
      className="min-h-screen bg-bg-main flex flex-col items-center justify-center gap-4 p-6 py-10"
      aria-label={t("auth_reset_title")}
    >
      <div className={cardClass}>
        <h1 className="text-h4 font-semibold text-ink-900">{t("auth_reset_title")}</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
          aria-describedby={missingResetToken ? tokenMissingAlertId : undefined}
        >
          {missingResetToken ? (
            <p id={tokenMissingAlertId} className="text-small text-danger" role="alert">
              {t("auth_reset_missingToken")}
            </p>
          ) : null}
          <input
            type="password"
            id={newPasswordId}
            placeholder={t("auth_reset_newPassword")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading || missingResetToken}
            aria-label={t("auth_reset_newPassword")}
            aria-invalid={!!error}
            aria-errormessage={error ? formErrorId : undefined}
            className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
          />
          <input
            type="password"
            id={confirmPasswordId}
            placeholder={t("auth_reset_confirmPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading || missingResetToken}
            aria-label={t("auth_reset_confirmPassword")}
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
            disabled={loading || missingResetToken}
            aria-busy={loading ? true : undefined}
            className={`btn-console w-full rounded-[var(--radius-sm)] bg-travel-500 text-white py-2 text-small font-medium disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {loading ? t("auth_reset_submitting") : t("auth_reset_submit")}
          </button>
        </form>
        <p className="text-meta text-ink-500">
          <Link href="/auth/login" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("auth_reset_backLogin")}
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

export default function ResetPasswordPage() {
  return (
    <AuthFullBleedSearchParamsSuspense mainAriaLabelKey="auth_reset_title">
      <ResetPasswordInner />
    </AuthFullBleedSearchParamsSuspense>
  );
}
