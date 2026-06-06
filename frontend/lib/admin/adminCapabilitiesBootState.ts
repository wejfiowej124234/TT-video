/** 会话内 capabilities 曾就绪后，子页不再因后台 refresh 被 boot gate 整页替换。 */
let adminCapabilitiesEverLoaded = false;

export function markAdminCapabilitiesBootReady(ready: boolean): void {
  if (ready) adminCapabilitiesEverLoaded = true;
}

export function resetAdminCapabilitiesBootState(): void {
  adminCapabilitiesEverLoaded = false;
}

export function adminSubpageBootBlocked(input: {
  loading: boolean;
  permissionsLoaded: boolean;
  capabilitiesUnavailable: boolean;
}): boolean {
  if (input.capabilitiesUnavailable) return false;
  if (adminCapabilitiesEverLoaded) return false;
  return input.loading || !input.permissionsLoaded;
}

/** @internal vitest */
export function resetAdminCapabilitiesBootStateForTests(): void {
  resetAdminCapabilitiesBootState();
}
