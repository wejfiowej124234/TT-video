"use client";

import { useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_TEXT_META_CLASS } from "@/lib/adminUi";

/** RP-010 · capabilities boot / workspace skeleton slow-path copy (UI only). */
export function AdminSubpageRouteLoadingSlowHint({
  delayMs = 2500,
  messageKey = "admin_capabilities_boot_slow_hint",
}: {
  delayMs?: number;
  messageKey?: string;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  if (!visible) return null;

  return (
    <p
      className={`mt-4 text-center ${ADMIN_TEXT_META_CLASS} text-ink-600`}
      role="status"
      aria-live="polite"
      data-tt-admin-capabilities-boot-slow-hint="1"
    >
      {t(messageKey)}
    </p>
  );
}
