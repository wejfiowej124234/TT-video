"use client";

import { useCallback, useEffect, useState } from "react";
import { STEWARD_WORKBENCH_STAKE_ANCHOR } from "@/lib/me/meIdentitiesCoreCardModel";

function readStakeAnchorOpen(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash === `#${STEWARD_WORKBENCH_STAKE_ANCHOR}`;
}

function scrollToStewardStakeAnchor(): void {
  if (typeof window === "undefined") return;
  document.getElementById(STEWARD_WORKBENCH_STAKE_ANCHOR)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/** `#steward-ttg-stake` 锚点是否打开（门闸 CTA / 深链展开质押操作区） */
export function useStewardStakePanelAnchorOpen(enabled: boolean): {
  stakeAnchorOpen: boolean;
  openStakePanel: () => void;
} {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const sync = () => setOpen(readStakeAnchorOpen());
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, [enabled]);

  const openStakePanel = useCallback(() => {
    if (typeof window === "undefined") return;
    setOpen(true);
    const hash = `#${STEWARD_WORKBENCH_STAKE_ANCHOR}`;
    const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
      window.history.pushState(null, "", nextUrl);
    }
    requestAnimationFrame(scrollToStewardStakeAnchor);
  }, []);

  useEffect(() => {
    if (!enabled || !open) return;
    requestAnimationFrame(scrollToStewardStakeAnchor);
  }, [enabled, open]);

  return { stakeAnchorOpen: open, openStakePanel };
}
