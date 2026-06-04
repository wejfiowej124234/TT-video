"use client";

import { type RefObject, useEffect, useId } from "react";

/** U5 · ① 统一收件箱任务详情：Escape 收起 + 展开后焦点移入面板 + 收起还焦切换钮。 */
export function useAdminUnifiedInboxDetailPanel(
  detailTaskId: string | null,
  setDetailTaskId: (id: string | null) => void,
  panelRef: RefObject<HTMLElement | null>,
  toggleRef: RefObject<HTMLButtonElement | null>,
) {
  const detailPanelId = useId();

  useEffect(() => {
    if (!detailTaskId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetailTaskId(null);
        requestAnimationFrame(() => toggleRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailTaskId, setDetailTaskId, toggleRef]);

  useEffect(() => {
    if (!detailTaskId || !panelRef.current) return;
    const root = panelRef.current;
    const focusable = root.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    (focusable ?? root).focus({ preventScroll: true });
  }, [detailTaskId, panelRef]);

  return { detailPanelId };
}
