"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { putMePassword } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { PASSWORD_MIN_LEN } from "@/app/auth/register/constants";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

/** 修改密码页（`PUT /api/v1/me/password`）；04 §三 3.2；与注册同源最短密码长度（`PASSWORD_MIN_LEN`）。 */
export default function MePasswordPage() {
  const { t } = useTranslation();
  const formErrorId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const footerLinkClass = `${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`;
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t("mePassword_mismatch"));
      return;
    }
    if (!newPassword.trim()) {
      setError(t("mePassword_required"));
      return;
    }
    if (newPassword.length < PASSWORD_MIN_LEN) {
      setError(t("mePassword_tooShort", { n: PASSWORD_MIN_LEN }));
      return;
    }
    setSubmitting(true);
    putMePassword({ old_password: oldPassword || undefined, new_password: newPassword })
      .then(() => {
        setSuccess(true);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("MePassword:", err);
        }
        setError(mapApiReadError(err, t, "mePassword_failed"));
      })
      .finally(() => setSubmitting(false));
  };

  const cardClass = "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6";
  if (success) {
    return (
      <main className="min-h-screen bg-bg-main flex items-center justify-center p-6" aria-label={t("mePassword_title")}>
        <div className={`w-full max-w-md ${cardClass} space-y-4`}>
          <h1 className="text-h4 font-semibold text-ink-900">{t("mePassword_title")}</h1>
          <p className="text-success">{t("mePassword_successMessage")}</p>
          <p className="text-meta text-ink-500"><Link href="/community/me" className={footerLinkClass}>{t("mePassword_backMe")}</Link></p>
          <ProductCrossNav
            ariaLabelKey="me_password_relatedNav_aria"
            showGuides
          />
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-bg-main flex items-center justify-center p-6" aria-label={t("mePassword_title")}>
      <div className={`w-full max-w-md ${cardClass} space-y-4`}>
        <h1 className="text-h4 font-semibold text-ink-900">{t("mePassword_title")}</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor={currentPasswordId} className="mb-1 block text-small text-ink-600">
              {t("mePassword_currentPassword")}
            </label>
            <input
              id={currentPasswordId}
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder={t("mePassword_currentPlaceholder")}
              autoComplete="current-password"
              aria-invalid={!!error}
              aria-errormessage={error ? formErrorId : undefined}
              className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-small bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            />
          </div>
          <div>
            <label htmlFor={newPasswordId} className="mb-1 block text-small text-ink-600">
              {t("mePassword_newPassword")}
            </label>
            <input
              id={newPasswordId}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("mePassword_requiredPlaceholder")}
              autoComplete="new-password"
              aria-invalid={!!error}
              aria-errormessage={error ? formErrorId : undefined}
              className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-small bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            />
          </div>
          <div>
            <label htmlFor={confirmPasswordId} className="mb-1 block text-small text-ink-600">
              {t("mePassword_confirmPassword")}
            </label>
            <input
              id={confirmPasswordId}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("mePassword_requiredPlaceholder")}
              autoComplete="new-password"
              aria-invalid={!!error}
              aria-errormessage={error ? formErrorId : undefined}
              className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-small bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            />
          </div>
          {error ? (
            <p id={formErrorId} className="text-small text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting ? true : undefined}
              className={`btn-console inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-small font-medium text-white transition-colors motion-reduce:transition-none disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              {submitting ? t("common_submitting") : t("mePassword_submit")}
            </button>
            <Link
              href="/community/me"
              className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small text-ink-700 transition-colors hover:bg-ink-50 motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
            >
              {t("mePassword_cancel")}
            </Link>
          </div>
        </form>
        <p className="mt-4 text-meta text-ink-500">
          <Link href="/community/me" className={footerLinkClass}>{t("mePassword_me")}</Link>
          {" · "}
          <Link href="/" className={footerLinkClass}>{t("auth_forgot_home")}</Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="me_password_relatedNav_aria"
          showGuides
          className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
        />
      </div>
    </main>
  );
}
