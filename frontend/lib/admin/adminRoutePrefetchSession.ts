let adminRoutePrefetchSessionStarted = false;

export function adminRoutePrefetchSessionActive(): boolean {
  return adminRoutePrefetchSessionStarted;
}

export function markAdminRoutePrefetchSessionStarted(): void {
  adminRoutePrefetchSessionStarted = true;
}

export function resetAdminRoutePrefetchSession(): void {
  adminRoutePrefetchSessionStarted = false;
}
