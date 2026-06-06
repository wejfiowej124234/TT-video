"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CommunityPostUserVisibility } from "@/lib/communityMockData";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

type TFunc = (k: string) => string;

const VISIBILITY_MENU_OPTIONS: {
  key: CommunityPostUserVisibility;
  labelKey: string;
}[] = [
  { key: "public", labelKey: "community_post_visibility_public" },
  { key: "private", labelKey: "community_post_visibility_private" },
  { key: "archived", labelKey: "community_post_visibility_archived" },
];

/**
 * 个人中心弹层方格卡片右上角 ⋮：可见性（可选）+ 删除 + 本弹窗内置顶（纯前端顺序，不调用服务端）。
 */
export function CommunityMeNotesCardOverflowMenu({
  itemId,
  t,
  onDelete,
  onPinToTop,
  deleteBusyId,
  deleteDisabled,
  deleteDisabledTitle,
  deleteLabelKey = "community_me_notes_menu_delete",
  deletePendingLabelKey = "community_me_notes_menu_delete_pending",
  showPinOption = true,
  showVisibilityOptions = false,
  currentVisibility = "public",
  onVisibilityChange,
  visibilityBusyId,
}: {
  itemId: string;
  t: TFunc;
  onDelete: (id: string) => void;
  onPinToTop: (id: string) => void;
  deleteBusyId?: string | null;
  deleteDisabled?: boolean;
  deleteDisabledTitle?: string;
  deleteLabelKey?: string;
  deletePendingLabelKey?: string;
  showPinOption?: boolean;
  showVisibilityOptions?: boolean;
  currentVisibility?: CommunityPostUserVisibility;
  onVisibilityChange?: (id: string, next: CommunityPostUserVisibility) => void;
  visibilityBusyId?: string | null;
}) {
  const menuHeadingId = useId();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const open = menuOpenId === itemId;
  const busy = deleteBusyId === itemId;
  const visBusy = visibilityBusyId === itemId;
  const menuDisabled = busy || visBusy;

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
    <div className="absolute right-0.5 top-0.5 z-[10]" data-community-me-notes-card-menu>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${menuHeadingId}-${itemId}` : undefined}
        aria-label={t("community_me_notes_card_menu_aria")}
        disabled={menuDisabled}
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
          {showVisibilityOptions && onVisibilityChange
            ? VISIBILITY_MENU_OPTIONS.filter((opt) => opt.key !== currentVisibility).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  role="menuitem"
                  disabled={menuDisabled}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onVisibilityChange(itemId, opt.key);
                    setMenuOpenId(null);
                  }}
                  className={`${touchTargetLink44Classes} block w-full px-3 py-2 text-left text-[0.7rem] font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  {visBusy ? t("common_loading") : t(opt.labelKey)}
                </button>
              ))
            : null}
          <button
            type="button"
            role="menuitem"
            disabled={deleteDisabled || menuDisabled}
            title={deleteDisabled ? deleteDisabledTitle : undefined}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(itemId);
              setMenuOpenId(null);
            }}
            className={`${touchTargetLink44Classes} block w-full px-3 py-2 text-left text-[0.7rem] font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45`}
          >
            {busy ? t(deletePendingLabelKey) : t(deleteLabelKey)}
          </button>
          {showPinOption ? (
            <button
              type="button"
              role="menuitem"
              disabled={menuDisabled}
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
