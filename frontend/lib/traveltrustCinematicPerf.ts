/** ① 本地：WebGL 降载 / 延迟挂载（TT-PH1-159 / 160） */
const LOW_KEY = "tt-traveltrust-cinematic-low";
const LOW_PREFS_KEY = "tt-traveltrust-cinematic-low-prefs";

export type TraveltrustCinematicQualityPref = "auto" | "on" | "off";

export function shouldAutoTraveltrustCinematicLowQuality(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_TRAVELTRUST_CINEMATIC_LOW === "1") return true;
  if (window.matchMedia("(max-width: 768px)").matches) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") return true;
  return false;
}

export function getTraveltrustCinematicQualityPref(): TraveltrustCinematicQualityPref {
  if (typeof window === "undefined") return "auto";
  try {
    const raw = sessionStorage.getItem(LOW_PREFS_KEY);
    if (raw === "on" || raw === "off" || raw === "auto") return raw;
  } catch {
    /* ignore */
  }
  return "auto";
}

/** 首访按设备/网络默认低画质，不刷新页面（TT-PH1-160） */
export function initTraveltrustCinematicQualityPrefs(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = sessionStorage.getItem(LOW_PREFS_KEY);
    if (existing === "on") {
      sessionStorage.setItem(LOW_KEY, "1");
      return;
    }
    if (existing === "off") {
      sessionStorage.setItem(LOW_KEY, "0");
      return;
    }
    if (shouldAutoTraveltrustCinematicLowQuality()) {
      sessionStorage.setItem(LOW_PREFS_KEY, "auto");
      sessionStorage.setItem(LOW_KEY, "1");
    } else {
      sessionStorage.setItem(LOW_PREFS_KEY, "auto");
      sessionStorage.setItem(LOW_KEY, "0");
    }
  } catch {
    /* ignore */
  }
}

export function setTraveltrustCinematicQualityPref(pref: TraveltrustCinematicQualityPref): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LOW_PREFS_KEY, pref);
    const low = pref === "on" || (pref === "auto" && shouldAutoTraveltrustCinematicLowQuality());
    sessionStorage.setItem(LOW_KEY, low ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function isTraveltrustCinematicLowQuality(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_TRAVELTRUST_CINEMATIC_LOW === "1") return true;
  try {
    return sessionStorage.getItem(LOW_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTraveltrustCinematicLowQuality(enabled: boolean): void {
  setTraveltrustCinematicQualityPref(enabled ? "on" : "off");
}

/** 首屏 paint 后再挂 WebGL，改善 LCP */
export function scheduleTraveltrustWebGLMount(onReady: () => void, delayMs = 140): () => void {
  if (typeof window === "undefined") {
    onReady();
    return () => undefined;
  }
  const run = () => onReady();
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: delayMs + 500 });
    return () => window.cancelIdleCallback(id);
  }
  const t = globalThis.setTimeout(run, delayMs);
  return () => globalThis.clearTimeout(t);
}
