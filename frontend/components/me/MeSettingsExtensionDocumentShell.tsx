"use client";

import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsExtensionChrome } from "@/components/me/MeSettingsExtensionChrome";

/** 帮助 / 隐私 / 条款等：无 `from=settings` 为 console 文档；有时为 L5 暖金壳 + 回 Hub */
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
  /** 例如 `data-tt-privacy-from-settings` */
  dataMarker: string;
  noticeKey?: string;
  ariaLabel: string;
  t: (key: string) => string;
  children: React.ReactNode;
}) {
  if (fromSettings) {
    return (
      <MeSettingsL5FlowPage
        ariaLabel={ariaLabel}
        route={route}
        dataAttrs={{ [dataMarker]: "1" }}
        showMinimalFooter={false}
      >
        <MeSettingsExtensionChrome t={t} noticeKey={noticeKey} />
        <div className="space-y-6 not-prose max-w-2xl">{children}</div>
      </MeSettingsL5FlowPage>
    );
  }

  return (
    <main className="min-h-screen bg-bg-console py-12 px-4" aria-label={ariaLabel}>
      <div className="max-w-2xl mx-auto prose prose-ink">{children}</div>
    </main>
  );
}
