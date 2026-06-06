"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDialogFocusPanel } from "@/components/admin/AdminDialogFocusPanel";
import { AdminDialogScrim } from "@/components/admin/AdminDialogScrim";
import { AdminModalWarmL5Panel } from "@/components/admin/AdminModalWarmL5Panel";
import { ADMIN_L5_CONFIRM_DATA_ATTR } from "@/lib/admin/adminL5ConfirmTypes";
import type { AdminL5ConfirmRequest } from "@/lib/admin/adminL5ConfirmTypes";
import {
  ADMIN_DESTRUCTIVE_SOFT_BTN_CLASS,
  ADMIN_MODAL_CANCEL_BTN_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
} from "@/lib/adminUi";
import { adminModalPortalRootSheetClass } from "@/components/market/marketStudioModalLayout";

type Props = {
  open: boolean;
  busy: boolean;
  pending: AdminL5ConfirmRequest | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function AdminL5ConfirmDialog({ open, busy, pending, onCancel, onConfirm }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  if (!portalReady || !open || !pending || typeof document === "undefined") return null;

  const confirmClass = pending.danger ? ADMIN_DESTRUCTIVE_SOFT_BTN_CLASS : ADMIN_PRIMARY_ACTION_BTN_CLASS;

  return createPortal(
    <div
      className={adminModalPortalRootSheetClass}
      data-tt-admin-l5-confirm={ADMIN_L5_CONFIRM_DATA_ATTR}
    >
      <AdminDialogScrim onClose={onCancel} />
      <AdminDialogFocusPanel onClose={onCancel} className="relative z-[101] flex min-h-full items-center justify-center p-4">
        <AdminModalWarmL5Panel
          className="max-w-md w-full"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <h2 id={titleId} className="text-body font-semibold text-ink-900">
            {t(pending.titleKey)}
          </h2>
          <p id={descId} className="mt-2 text-body text-ink-700">
            {t(pending.descKey, pending.descVars)}
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" className={ADMIN_MODAL_CANCEL_BTN_CLASS} onClick={onCancel} disabled={busy}>
              {t("common_cancel")}
            </button>
            <button type="button" className={confirmClass} onClick={() => void onConfirm()} disabled={busy}>
              {busy ? t("common_loading") : t(pending.confirmLabelKey ?? "common_confirm")}
            </button>
          </div>
        </AdminModalWarmL5Panel>
      </AdminDialogFocusPanel>
    </div>,
    document.body,
  );
}
