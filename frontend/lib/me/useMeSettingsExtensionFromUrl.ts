"use client";

import { useSearchParams } from "next/navigation";
import { isMeSettingsExtensionFromQuery } from "@/lib/me/meSettingsExtensionContext";

/** 当前 URL 是否从设置 Hub 进入（`?from=settings` / `settings-data`） */
export function useMeSettingsExtensionFromUrl(): boolean {
  const searchParams = useSearchParams();
  return isMeSettingsExtensionFromQuery(searchParams.get("from"));
}
