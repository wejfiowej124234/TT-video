"use client";

import { MeSettingsExtensionIngressBlock } from "@/components/me/MeSettingsExtensionIngressBlock";
import { WorkspaceL5BackLink } from "@/components/workspace/WorkspaceL5BackLink";

/** 工作台顶栏：来自设置时回链 + 说明；否则单链回设置中心 */
export function WorkspaceL5SettingsIngress({
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
  if (fromSettings) {
    return (
      <MeSettingsExtensionIngressBlock
        fromSettings={fromSettings}
        noticeKey={noticeKey}
        showNotice={showNotice}
        t={t}
      />
    );
  }
  return <WorkspaceL5BackLink t={t} />;
}
