import { TRAVELTRUST_HOME_ENTRY_GATE_L5, TRAVELTRUST_HOME_PREFETCH_L5 } from "./constants";
import {
  TRAVELTRUST_HOME_CRITICAL_CHUNK_LOADERS,
  TRAVELTRUST_HOME_DEFERRED_BELOW_FOLD_LOADER,
} from "../sections/registry";

let prefetchStarted = false;

/** 幂等：layout / 入口闸启动时拉关键 dynamic chunk */
export function runTraveltrustHomeCriticalPrefetch(): void {
  if (typeof window === "undefined" || prefetchStarted) return;
  prefetchStarted = true;
  for (const load of TRAVELTRUST_HOME_CRITICAL_CHUNK_LOADERS) {
    void load().catch(() => undefined);
  }
}

export function scheduleTraveltrustHomeDeferredPrefetch(onSectionsReady?: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const run = () => {
    void TRAVELTRUST_HOME_DEFERRED_BELOW_FOLD_LOADER()
      .then(() => onSectionsReady?.())
      .catch(() => undefined);
  };
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(run, {
      timeout: TRAVELTRUST_HOME_PREFETCH_L5.idleTimeoutMs,
    });
    return () => window.cancelIdleCallback(id);
  }
  const t = globalThis.setTimeout(run, TRAVELTRUST_HOME_PREFETCH_L5.fallbackDelayMs);
  return () => globalThis.clearTimeout(t);
}

export function shouldSkipTraveltrustHomeEntryGate(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (new URLSearchParams(window.location.search).has(TRAVELTRUST_HOME_ENTRY_GATE_L5.querySkipParam)) {
      return true;
    }
    return sessionStorage.getItem(TRAVELTRUST_HOME_ENTRY_GATE_L5.sessionDoneKey) === "1";
  } catch {
    return false;
  }
}

export function markTraveltrustHomeEntryGateDone(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(TRAVELTRUST_HOME_ENTRY_GATE_L5.sessionDoneKey, "1");
  } catch {
    /* ignore */
  }
}
