"use client";

import { MeSettingsExtensionChrome } from "@/components/me/MeSettingsExtensionChrome";

export function meSettingsExtensionIngressDataAttrs(
  fromSettings: boolean,
  marker: string,
): Record<string, string> {
  return fromSettings ? { [marker]: "1" } : {};
}

/** 入驻 / 工作台等 L5 页顶：设置族回 Hub + 说明 */
export function MeSettingsExtensionIngressBlock({
  fromSettings,
  noticeKey,
  t,
}: {
  fromSettings: boolean;
  noticeKey: string;
  t: (key: string) => string;
}) {
  if (!fromSettings) return null;
  return <MeSettingsExtensionChrome t={t} noticeKey={noticeKey} />;
}
