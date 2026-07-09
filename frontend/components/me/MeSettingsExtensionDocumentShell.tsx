"use client";

import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsExtensionChrome } from "@/components/me/MeSettingsExtensionChrome";

/** 帮助 / 隐私 / 条款 · 统一 L5 暖金暗色壳（不再使用 Console 浅色 prose） */
export function MeSettingsExtensionDocumentShell({
  fromSettings,
  route,
  dataMarker,
  noticeKey,
  ariaLabel,
  t,
  children,
}: {
  fromSettings: boolean;
  route: string;
  dataMarker: string;
  noticeKey?: string;
  ariaLabel: string;
  t: (key: string) => string;
  children: React.ReactNode;
}) {
  return (
    <MeSettingsL5FlowPage
      ariaLabel={ariaLabel}
      route={route}
      dataAttrs={{ [dataMarker]: "1", "data-tt-public-l5-doc": "1" }}
      showMinimalFooter={!fromSettings}
    >
      {fromSettings ? <MeSettingsExtensionChrome t={t} noticeKey={noticeKey} /> : null}
      <div className="space-y-6 not-prose max-w-2xl">{children}</div>
    </MeSettingsL5FlowPage>
  );
}
