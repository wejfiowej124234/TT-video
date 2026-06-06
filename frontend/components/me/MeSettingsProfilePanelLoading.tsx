"use client";

import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

/** 设置 L5 · 个人资料加载骨架（暖金壳 · 非社区 cyan pulse） */
export function MeSettingsProfilePanelLoading() {
  return (
    <div className={TT_ME_SETTINGS_L5.profilePageStack} aria-busy="true" data-tt-me-settings-profile-loading="1">
      <div className={`${TT_ME_SETTINGS_L5.profileIdentityCard} animate-pulse motion-reduce:animate-none`}>
        <div className={TT_ME_SETTINGS_L5.profileIdentityRow}>
          <div className={`${TT_ME_SETTINGS_L5.profileIdentityAvatar} bg-ref-sun/10`} />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-6 w-36 rounded bg-ref-sun/10" />
            <div className="h-4 w-20 rounded bg-slate-700/50" />
            <div className="h-4 w-full max-w-sm rounded bg-slate-700/40" />
          </div>
        </div>
      </div>
      <div className={`${TT_ME_SETTINGS_L5.sectionCard} h-28 animate-pulse motion-reduce:animate-none bg-ref-sun/[0.03]`} />
      <div className={`${TT_ME_SETTINGS_L5.profileDetailsCard} h-40 animate-pulse motion-reduce:animate-none bg-ref-sun/[0.03]`} />
    </div>
  );
}
