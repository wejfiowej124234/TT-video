/** PH1-FE-02：开发态 traveltrust-api 不可用时，避免顶栏反复 `GET /me` 刷红（① 本地） */
const DEV_API_OFFLINE_SS_KEY = "traveltrust_dev_api_offline_v1";

let devApiOfflineMeBlockedMemory = false;

export function isDevUpstreamMeUnavailableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

export function isDevApiOfflineMeFetchBlocked(): boolean {
  if (typeof process === "undefined" || process.env.NODE_ENV !== "development") return false;
  if (devApiOfflineMeBlockedMemory) return true;
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(DEV_API_OFFLINE_SS_KEY) === "1";
  } catch {
    return false;
  }
}

export function markDevApiOfflineMeFetchBlocked(): void {
  if (typeof process === "undefined" || process.env.NODE_ENV !== "development") return;
  devApiOfflineMeBlockedMemory = true;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DEV_API_OFFLINE_SS_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearDevApiOfflineMeFetchBlocked(): void {
  devApiOfflineMeBlockedMemory = false;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DEV_API_OFFLINE_SS_KEY);
  } catch {
    /* ignore */
  }
}
