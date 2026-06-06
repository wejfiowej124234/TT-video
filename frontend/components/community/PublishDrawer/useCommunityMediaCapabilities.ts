"use client";

import { useEffect, useState } from "react";
import {
  getCommunityMediaCapabilities,
  type CommunityMediaCapabilities,
} from "@/lib/apiClient/community/mediaCapabilities";

export type CommunityMediaCapabilitiesState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: CommunityMediaCapabilities };

/** 抽屉 `entered` 为真时拉取一次；关闭抽屉不主动清空（下次打开会 refetch）。 */
export function useCommunityMediaCapabilities(drawerEntered: boolean): CommunityMediaCapabilitiesState {
  const [state, setState] = useState<CommunityMediaCapabilitiesState>({ kind: "idle" });

  useEffect(() => {
    if (!drawerEntered) {
      setState({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });
    void (async () => {
      try {
        const data = await getCommunityMediaCapabilities();
        if (cancelled) return;
        setState({ kind: "ready", data });
      } catch {
        if (cancelled) return;
        setState({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drawerEntered]);

  return state;
}
