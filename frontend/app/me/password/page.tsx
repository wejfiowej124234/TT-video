"use client";

import { useState } from "react";
import Link from "next/link";
import { putMePassword } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

/** 修改密码页（PUT /api/v1/me/password）；04 §三 3.2，后端 chain_off stub 已接 */
export default function MePasswordPage() {
  const { t } = useTranslation();
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
          <p className="text-meta text-ink-500"><Link href="/community/me" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("mePassword_backMe")}</Link></p>
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
            <label className="block text-small text-ink-600 mb-1">{t("mePassword_currentPassword")}</label>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder={t("mePassword_currentPlaceholder")} className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-small bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`} />
          </div>
          <div>
            <label className="block text-small text-ink-600 mb-1">{t("mePassword_newPassword")}</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} aria-label={t("mePassword_newPassword")} placeholder={t("mePassword_requiredPlaceholder")} className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-small bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`} />
          </div>
          <div>
            <label className="block text-small text-ink-600 mb-1">{t("mePassword_confirmPassword")}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} aria-label={t("mePassword_confirmPassword")} placeholder={t("mePassword_requiredPlaceholder")} className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-small bg-bg-console ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`} />
          </div>
          {error && <p className="text-small text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} aria-busy={submitting ? true : undefined} className={`btn-console rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}>{submitting ? t("common_submitting") : t("mePassword_submit")}</button>
            <Link
              href="/community/me"
              className={`rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small inline-block text-ink-700 hover:bg-ink-50 ${travelFocusRingOffset2Classes}`}
            >
              {t("mePassword_cancel")}
            </Link>
          </div>
        </form>
        <p className="mt-4 text-meta text-ink-500">
          <Link href="/community/me" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("mePassword_me")}</Link>
          {" · "}
          <Link href="/" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("auth_forgot_home")}</Link>
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
