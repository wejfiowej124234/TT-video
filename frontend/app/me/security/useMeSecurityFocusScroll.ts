"use client";

import { useEffect } from "react";
import { ME_SECURITY_PANEL_IDS, type MeSecurityFocus } from "@/lib/me/meSecurityL5";

const FOCUS_TO_PANEL: Record<string, string> = {
  wallet: ME_SECURITY_PANEL_IDS.wallet,
  sessions: ME_SECURITY_PANEL_IDS.sessions,
  notifications: ME_SECURITY_PANEL_IDS.notifications,
};

export function useMeSecurityFocusScroll(focus: string | null | undefined) {
  useEffect(() => {
    if (!focus) return;
    const panelId = FOCUS_TO_PANEL[focus];
    if (!panelId) return;
    const el = document.getElementById(panelId);
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [focus]);
}

export function parseMeSecurityFocus(raw: string | null): MeSecurityFocus | null {
  if (raw === "wallet" || raw === "sessions" || raw === "notifications") return raw;
  return null;
}
