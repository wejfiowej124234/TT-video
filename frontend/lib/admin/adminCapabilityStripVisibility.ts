/** ① L5 · 能力条显隐（健康 SuperAdmin + 有 approve 时不占顶栏）。 */

export function shouldShowAdminCapabilityStrip(input: {
  permissionsLoaded: boolean;
  capabilitiesUnavailable: boolean;
  loading: boolean;
  canApprove: boolean;
  maintainerUi: boolean;
  /** IA-06 · Shell 六角色预览时须展示账号与预览分轨说明。 */
  shellPreviewActive?: boolean;
  /** batch55 · `/admin` 非聚焦时 `AdminHomeShellPreviewBanner` 为预览 SSOT。 */
  homeShellPreviewBannerActive?: boolean;
  /** VIS-17 · `/admin` 聚焦待办时顶栏降噪（错误/加载态仍展示）。 */
  homeInboxFocus?: boolean;
  /** 工作台 boot：capabilities 加载中由 `AdminHomeClient` 骨架承担，勿闪「正在读取角色…」。 */
  onWorkspace?: boolean;
}): boolean {
  if ((input.loading || !input.permissionsLoaded) && !input.capabilitiesUnavailable) {
    return false;
  }
  if (input.homeInboxFocus) {
    if (input.loading || !input.permissionsLoaded) return true;
    if (input.capabilitiesUnavailable) return true;
    return false;
  }
  if (input.homeShellPreviewBannerActive) {
    if (input.capabilitiesUnavailable) return true;
    return false;
  }
  if (input.shellPreviewActive) return true;
  if (input.maintainerUi) return true;
  if (input.loading || !input.permissionsLoaded) return true;
  if (input.capabilitiesUnavailable) return true;
  if (!input.canApprove) return true;
  return false;
}
