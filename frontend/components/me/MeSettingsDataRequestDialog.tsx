"use client";

import { MeSettingsL5ConfirmDialog } from "@/components/me/MeSettingsL5ConfirmDialog";

export function MeSettingsDataRequestDialog({
  open,
  busy,
  t,
  titleKey,
  descKey,
  confirmLabelKey = "me_settings_data_request_continue",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy?: boolean;
  t: (k: string, vars?: Record<string, string | number>) => string;
  titleKey: string;
  descKey: string;
  confirmLabelKey?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <MeSettingsL5ConfirmDialog
      open={open}
      busy={busy}
      t={t}
      titleKey={titleKey}
      descKey={descKey}
      danger
      confirmLabelKey={confirmLabelKey}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
