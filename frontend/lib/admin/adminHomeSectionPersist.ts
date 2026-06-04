const PREFIX = "tt-admin-home-section-";

export function adminHomeSectionStorageKey(sectionId: string): string {
  return `${PREFIX}${sectionId}`;
}

export function readAdminHomeSectionOpen(sectionId: string, defaultOpen: boolean): boolean {
  if (typeof window === "undefined") return defaultOpen;
  try {
    const raw = localStorage.getItem(adminHomeSectionStorageKey(sectionId));
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    /* ignore */
  }
  return defaultOpen;
}

export function writeAdminHomeSectionOpen(sectionId: string, open: boolean): void {
  try {
    localStorage.setItem(adminHomeSectionStorageKey(sectionId), open ? "1" : "0");
  } catch {
    /* ignore */
  }
}
