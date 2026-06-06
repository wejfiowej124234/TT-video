"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  meSettingsFlashMessageKey,
  parseMeSettingsFlash,
  type MeSettingsFlash,
} from "@/lib/me/meSettingsHubFlash";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";

export function useMeSettingsHubFlash(t: (key: string) => string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flash = parseMeSettingsFlash(searchParams?.get("flash") ?? null);

  const message = useMemo(() => {
    if (!flash) return null;
    return t(meSettingsFlashMessageKey(flash));
  }, [flash, t]);

  const dismiss = useCallback(() => {
    router.replace(ME_SETTINGS_HUB_PATH);
  }, [router]);

  return flash && message ? { flash: flash as MeSettingsFlash, message, dismiss } : null;
}
