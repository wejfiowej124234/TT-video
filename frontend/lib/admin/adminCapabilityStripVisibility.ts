/** ① L5 · 能力条显隐（健康 SuperAdmin + 有 approve 时不占顶栏）。 */

export function shouldShowAdminCapabilityStrip(input: {
  permissionsLoaded: boolean;
  capabilitiesUnavailable: boolean;
  loading: boolean;
  canApprove: boolean;
  maintainerUi: boolean;
}): boolean {
  if (input.maintainerUi) return true;
  if (input.loading || !input.permissionsLoaded) return true;
  if (input.capabilitiesUnavailable) return true;
  if (!input.canApprove) return true;
  return false;
}
