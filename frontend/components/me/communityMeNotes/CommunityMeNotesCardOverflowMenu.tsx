"use client";

import { useEffect, useId, useRef, useState } from "react";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

type TFunc = (k: string) => string;

/**
 * 个人中心弹层方格卡片右上角 ⋮：删除 + 本弹窗内置顶（纯前端顺序，不调用服务端）。
 */
export function CommunityMeNotesCardOverflowMenu({
  itemId,
  t,
  onDelete,
  onPinToTop,
  deleteBusyId,
  deleteDisabled,
  deleteDisabledTitle,
}: {
  itemId: string;
  t: TFunc;
  onDelete: (id: string) => void;
  onPinToTop: (id: string) => void;
  deleteBusyId?: string | null;
  deleteDisabled?: boolean;
  deleteDisabledTitle?: string;
}) {
  const menuHeadingId = useId();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const open = menuOpenId === itemId;
  const busy = deleteBusyId === itemId;

  useEffect(() => {
    if (!open) return;
    const onDoc = (ev: MouseEvent) => {
      const n = ev.target as Node | null;
      if (!n) return;
      if (menuPanelRef.current?.contains(n)) return;
      if ((ev.target as HTMLElement | null)?.closest?.("[data-community-me-notes-card-menu]")) return;
      setMenuOpenId(null);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setMenuOpenId(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="absolute right-0.5 top-0.5 z-[4]" data-community-me-notes-card-menu>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${menuHeadingId}-${itemId}` : undefined}
        aria-label={t("community_me_notes_card_menu_aria")}
        disabled={busy}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpenId((cur) => (cur === itemId ? null : itemId));
        }}
        className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} flex h-9 min-w-[36px] items-center justify-center rounded-[var(--radius-md)] border border-white/25 bg-black/55 text-lg leading-none text-white/95 shadow-md backdrop-blur-sm hover:bg-black/70 disabled:opacity-50`}
      >
        ⋮
      </button>
      {open ? (
        <div
          ref={menuPanelRef}
          id={`${menuHeadingId}-${itemId}`}
          role="menu"
          aria-label={t("community_me_notes_card_menu_aria")}
          className="min-w-[10rem] rounded-[var(--radius-sm)] border border-white/20 bg-ink-900/95 py-1 text-left shadow-strong ring-1 ring-cyan-500/20"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            disabled={deleteDisabled || busy}
            title={deleteDisabled ? deleteDisabledTitle : undefined}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(itemId);
              setMenuOpenId(null);
            }}
            className={`${touchTargetLink44Classes} block w-full px-3 py-2 text-left text-[0.7rem] font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45`}
          >
            {busy ? t("community_me_notes_menu_delete_pending") : t("community_me_notes_menu_delete")}
          </button>
          <button
            type="button"
            role="menuitem"
            title={t("community_me_notes_menu_pin_hint")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPinToTop(itemId);
              setMenuOpenId(null);
            }}
            className={`${touchTargetLink44Classes} block w-full px-3 py-2 text-left text-[0.7rem] font-medium text-white hover:bg-white/10`}
          >
            {t("community_me_notes_menu_pin")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
