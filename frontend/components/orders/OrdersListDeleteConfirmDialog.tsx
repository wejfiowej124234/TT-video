"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  ORDERS_LIST_L5_DELETE_CONFIRM_DATA_ATTR,
  TT_ORDERS_LIST_L5,
} from "@/lib/orders/ordersListL5";

export function OrdersListDeleteConfirmDialog({
  open,
  busy,
  t,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy?: boolean;
  t: (k: string) => string;
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

  return createPortal(
    <div
      className={TT_ORDERS_LIST_L5.deleteConfirmOverlay}
      data-tt-orders-list-delete-confirm={ORDERS_LIST_L5_DELETE_CONFIRM_DATA_ATTR}
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
        className={TT_ORDERS_LIST_L5.deleteConfirmPanel}
        tabIndex={-1}
      >
        <h2 id={titleId} className={TT_ORDERS_LIST_L5.deleteConfirmTitle}>
          {t("escrow_deleteOrder")}
        </h2>
        <p id={descId} className={TT_ORDERS_LIST_L5.deleteConfirmDesc}>
          {t("escrow_deleteConfirm")}
        </p>
        <div className={TT_ORDERS_LIST_L5.deleteConfirmActions}>
          <button
            type="button"
            className={TT_ORDERS_LIST_L5.deleteConfirmBtnCancel}
            onClick={onCancel}
            disabled={busy}
          >
            {t("common_cancel")}
          </button>
          <button
            type="button"
            className={TT_ORDERS_LIST_L5.deleteConfirmBtnDanger}
            onClick={() => void onConfirm()}
            disabled={busy}
          >
            {busy ? t("common_submitting") : t("escrow_deleteOrder")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
