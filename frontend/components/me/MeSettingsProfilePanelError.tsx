"use client";

import { type FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

type TFunc = (key: string) => string;

export function MeSettingsProfilePanelError({
  message,
  onRetry,
  t,
}: {
  message: string;
  onRetry: () => void;
  t: TFunc;
}) {
  return (
    <div className={`${TT_ME_SETTINGS_L5.sectionCard} px-4 py-4 space-y-3`} role="alert">
      <ApiErrorAlert message={message} tone="dark" />
      <form
        className="inline"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onRetry();
        }}
      >
        <button type="submit" className={`${TT_AUTH_L5_FORM.secondaryButton} min-h-[44px] px-5`}>
          {t("common_retry")}
        </button>
      </form>
    </div>
  );
}
