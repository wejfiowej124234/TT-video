"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { HeaderUserMenuItemIcon } from "@/components/header/HeaderUserMenuItemIcon";
import { MeSettingsL5ConfirmDialog } from "@/components/me/MeSettingsL5ConfirmDialog";
import { useMeSettingsL5Confirm } from "@/hooks/useMeSettingsL5Confirm";
import { applyLocalLogoutAfterServerOk, postLogout } from "@/lib/apiClient";
import { FOCUS_RING } from "@/components/me/constants";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

type Variant = "settings" | "community";

export function MeLogoutL5Button({ variant = "settings" }: { variant?: Variant }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const confirm = useMeSettingsL5Confirm();

  async function performLogout() {
    if (typeof window === "undefined" || busy) return;
    setBusy(true);
    try {
      await postLogout();
      applyLocalLogoutAfterServerOk();
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("MeLogoutL5Button:", err);
      }
      applyLocalLogoutAfterServerOk();
      router.push("/auth/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function requestLogout() {
    confirm.request({
      titleKey: "me_settings_logout_confirm_title",
      descKey: "me_settings_logout_confirm_desc",
      danger: true,
      confirmLabelKey: variant === "community" ? "me_logout" : "header_logout",
      onConfirm: performLogout,
    });
  }

  const buttonClass =
    variant === "settings"
      ? TT_ME_SETTINGS_L5.logoutBtn
      : `inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/60 px-4 py-2.5 min-h-[44px] text-meta text-slate-300 hover:bg-slate-700/60 hover:text-slate-200 motion-sub ${FOCUS_RING}`;

  return (
    <>
      <button
        type="button"
        onClick={requestLogout}
        disabled={busy || confirm.busy}
        aria-busy={busy || confirm.busy ? true : undefined}
        data-tt-me-settings-logout={variant === "settings" ? "1" : undefined}
        data-tt-me-logout-l5={variant === "community" ? "1" : undefined}
        className={buttonClass}
      >
        {variant === "settings" ? <HeaderUserMenuItemIcon id="logout" /> : null}
        {variant === "community" ? t("me_logout") : t("header_logout")}
      </button>

      <MeSettingsL5ConfirmDialog
        open={confirm.open}
        busy={busy || confirm.busy}
        t={t}
        titleKey={confirm.pending?.titleKey ?? "me_settings_logout_confirm_title"}
        descKey={confirm.pending?.descKey ?? "me_settings_logout_confirm_desc"}
        danger
        confirmLabelKey={confirm.pending?.confirmLabelKey}
        onCancel={confirm.cancel}
        onConfirm={() => void confirm.confirm()}
      />
    </>
  );
}
