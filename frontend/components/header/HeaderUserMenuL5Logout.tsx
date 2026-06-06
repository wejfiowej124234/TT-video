"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MeSettingsL5ConfirmDialog } from "@/components/me/MeSettingsL5ConfirmDialog";
import { HeaderUserMenuItemIcon } from "@/components/header/HeaderUserMenuItemIcon";
import { useMeSettingsL5Confirm } from "@/hooks/useMeSettingsL5Confirm";
import { applyLocalLogoutAfterServerOk, postLogout } from "@/lib/apiClient";
import { TT_HEADER_USER_MENU_L5 } from "@/lib/header/headerUserMenuL5";

/** 顶栏 authL5 下拉 · L5 确认后登出（与 Hub `MeLogoutL5Button` 同源） */
export function HeaderUserMenuL5Logout({
  t,
  onDone,
}: {
  t: (key: string) => string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const confirm = useMeSettingsL5Confirm();

  async function performLogout() {
    if (typeof window === "undefined" || busy) return;
    setBusy(true);
    try {
      await postLogout();
      applyLocalLogoutAfterServerOk();
      onDone?.();
      router.push("/");
      router.refresh();
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("HeaderUserMenuL5Logout:", err);
      }
      applyLocalLogoutAfterServerOk();
      onDone?.();
      router.push("/");
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
      confirmLabelKey: "header_logout",
      onConfirm: performLogout,
    });
  }

  return (
    <>
      <form
        className={TT_HEADER_USER_MENU_L5.logoutWrap}
        onSubmit={(e) => {
          e.preventDefault();
          requestLogout();
        }}
      >
        <button
          type="button"
          onClick={requestLogout}
          disabled={busy || confirm.busy}
          aria-busy={busy || confirm.busy ? true : undefined}
          data-tt-header-logout-l5="1"
          className={TT_HEADER_USER_MENU_L5.logoutBtn}
          role="menuitem"
        >
          <span className={TT_HEADER_USER_MENU_L5.itemIcon} aria-hidden>
            <HeaderUserMenuItemIcon id="logout" />
          </span>
          <span className={TT_HEADER_USER_MENU_L5.itemLabel}>{t("header_logout")}</span>
        </button>
      </form>

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
