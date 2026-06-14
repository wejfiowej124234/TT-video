"use client";

import { MeSettingsExtensionChrome } from "@/components/me/MeSettingsExtensionChrome";

export function meSettingsExtensionIngressDataAttrs(
  fromSettings: boolean,
  marker: string,
): Record<string, string> {
  return fromSettings ? { [marker]: "1" } : {};
}

/** 入驻 / 工作台等 L5 页顶栏：设置族回 Hub + 可选说明 */
export function MeSettingsExtensionIngressBlock({
  fromSettings,
  noticeKey,
  showNotice = true,
  t,
}: {
  fromSettings: boolean;
  noticeKey: string;
  showNotice?: boolean;
  t: (key: string) => string;
}) {
  if (!fromSettings) return null;
  return <MeSettingsExtensionChrome t={t} noticeKey={showNotice ? noticeKey : undefined} />;
}
