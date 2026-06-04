"use client";

import { useEffect, useState } from "react";

/** Tailwind `lg` · 与 `AdminShellSidebar` `hidden lg:block` 同源。 */
export const ADMIN_SHELL_SIDEBAR_LAYOUT_MEDIA = "(min-width: 1024px)";

/** ① 侧栏布局是否激活（用于待办徽标降噪策略）。 */
export function useAdminShellSidebarVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia(ADMIN_SHELL_SIDEBAR_LAYOUT_MEDIA);
    const sync = () => setVisible(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return visible;
}
