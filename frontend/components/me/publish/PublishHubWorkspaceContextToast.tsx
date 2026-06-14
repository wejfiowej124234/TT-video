"use client";

import { useEffect } from "react";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

export function PublishHubWorkspaceContextToast({
  show,
  message,
  onDismiss,
}: {
  show: boolean;
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    const timer = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <p
      className={TT_ME_SETTINGS_L5.sectionCallout}
      role="status"
      aria-live="polite"
      data-tt-publish-hub-workspace-context-toast="1"
    >
      {message}
    </p>
  );
}
