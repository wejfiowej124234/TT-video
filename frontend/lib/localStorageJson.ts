/** Shared JSON string[] persistence for browser localStorage (with optional sessionStorage migration). */

export function readJsonStringArray(storage: Storage, key: string): string[] {
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  } catch {
    return [];
  }
}

export function writeJsonStringArray(storage: Storage, key: string, ids: string[]): void {
  try {
    if (ids.length === 0) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(ids));
  } catch {
    /* quota / private mode */
  }
}

const lastSerializedLocal = new Map<string, string>();

/** Skip write when serialized payload unchanged (reduces main-thread localStorage I/O). */
export function writeJsonStringArrayLocal(key: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  const next = ids.length === 0 ? "" : JSON.stringify(ids);
  if (lastSerializedLocal.get(key) === next) return;
  lastSerializedLocal.set(key, next);
  writeJsonStringArray(localStorage, key, ids);
}

/**
 * Read from localStorage; if empty, one-time migrate from sessionStorage (same key) then remove legacy.
 */
export function readJsonStringArrayLocalWithSessionMigration(key: string): string[] {
  if (typeof window === "undefined") return [];
  const fromLocal = readJsonStringArray(localStorage, key);
  if (fromLocal.length > 0) return fromLocal;

  const fromSession = readJsonStringArray(sessionStorage, key);
  if (fromSession.length === 0) return [];

  writeJsonStringArrayLocal(key, fromSession);
  sessionStorage.removeItem(key);
  return fromSession;
}

/** Fires when another tab changes localStorage (not the current tab). */
export function subscribeLocalStorageKeys(keys: readonly string[], onKeyChange: (key: string) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const allowed = new Set(keys);
  const handler = (event: StorageEvent) => {
    if (event.key && allowed.has(event.key)) onKeyChange(event.key);
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
