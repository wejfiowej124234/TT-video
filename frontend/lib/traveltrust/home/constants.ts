/** 首页入口闸与预取常量（编排层 SSOT · cinematic 经 lib 读取） */
export const TRAVELTRUST_HOME_ENTRY_GATE_L5 = {
  minVisibleMs: 720,
  maxWaitMs: 8000,
  briefFallbackMs: 1100,
  sessionDoneKey: "tt-traveltrust-home-entry-done-v1",
  querySkipParam: "tt_no_gate",
  /**
   * 遮罩从 L0 Header + L1 LandingChrome 下方开始，勿 `inset-0` 盖住公告（与 marketingUi 4.5rem + L1 ~3.25rem 对拍）
   */
  overlayInsetTopClass:
    "top-[calc(7.25rem+env(safe-area-inset-top,0px))] sm:top-[calc(8.25rem+env(safe-area-inset-top,0px))]",
} as const;

export const TRAVELTRUST_HOME_PREFETCH_L5 = {
  idleTimeoutMs: 600,
  fallbackDelayMs: 120,
} as const;

export const TRAVELTRUST_HOME_WEBGL_MOUNT_MS = {
  desktop: 90,
  mobile: 200,
} as const;
