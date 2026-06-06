"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  ME_SETTINGS_L5_CONFIRM_DATA_ATTR,
  TT_ME_SETTINGS_L5,
} from "@/lib/me/meSettingsL5";

export function MeSettingsL5ConfirmDialog({
  open,
  busy,
  t,
  titleKey,
  descKey,
  descVars,
  danger = false,
  confirmLabelKey = "common_confirm",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy?: boolean;
  t: (k: string, vars?: Record<string, string | number>) => string;
  titleKey: string;
  descKey: string;
  descVars?: Record<string, string | number>;
  danger?: boolean;
  confirmLabelKey?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const [portalReady, setPortalReady] = useState(false);
  const trapRef = useFocusTrap(open, onCancel);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!portalReady || !open || typeof document === "undefined") return null;

  const confirmBtnClass = danger ? TT_ME_SETTINGS_L5.confirmBtnDanger : TT_ME_SETTINGS_L5.confirmBtnPrimary;

  return createPortal(
    <div
      className={TT_ME_SETTINGS_L5.confirmOverlay}
      data-tt-me-settings-confirm={ME_SETTINGS_L5_CONFIRM_DATA_ATTR}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={trapRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={TT_ME_SETTINGS_L5.confirmPanel}
        tabIndex={-1}
      >
        <h2 id={titleId} className={TT_ME_SETTINGS_L5.confirmTitle}>
          {t(titleKey)}
        </h2>
        <p id={descId} className={TT_ME_SETTINGS_L5.confirmDesc}>
          {t(descKey, descVars)}
        </p>
        <div className={TT_ME_SETTINGS_L5.confirmActions}>
          <button
            type="button"
            className={TT_ME_SETTINGS_L5.confirmBtnCancel}
            onClick={onCancel}
            disabled={busy}
          >
            {t("common_cancel")}
          </button>
          <button
            type="button"
            className={confirmBtnClass}
            onClick={() => void onConfirm()}
            disabled={busy}
          >
            {busy ? t("common_loading") : t(confirmLabelKey)}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
