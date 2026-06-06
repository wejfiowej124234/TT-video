"use client";

import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

/** 设置族外链页顶栏：回 Hub + 可选说明（反馈 / 帮助等） */
export function MeSettingsExtensionChrome({
  t,
  noticeKey,
}: {
  t: (key: string) => string;
  noticeKey?: string;
}) {
  return (
    <div className="mb-4 space-y-3" data-tt-me-settings-extension-chrome="1">
      <MeSettingsHubBackLink t={t} />
      {noticeKey ? (
        <p className={TT_ME_SETTINGS_L5.sectionCallout}>{t(noticeKey)}</p>
      ) : null}
    </div>
  );
}
