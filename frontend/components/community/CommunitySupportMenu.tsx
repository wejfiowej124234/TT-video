"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
type Props = {
  /** 与壳层 Tab 一致：pointerdown 时触发顶栏进度条 */
  onNavStart?: () => void;
  /** mobile 顶栏第二行略小 */
  size?: "sm" | "md";
  /** 与桌面主 Tab 同一圆角条内：触发器样式与 Tab 对齐 */
  variant?: "toolbar" | "tabBar";
};

/**
 * 「帮助与支持」：建议与反馈、帮助中心、社区规范、完整活动中心 同一下拉。
 * `tabBar`：与动态/发现/…/个人中心同一顶栏行；`toolbar`：独立顶行或移动顶栏第二行。
 * 交互与 Header UserMenu 同型（点击外关闭、Escape）。
 */
export function CommunitySupportMenu({ onNavStart, size = "md", variant = "toolbar" }: Props) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const onFeedback = pathname?.startsWith("/community/feedback") ?? false;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const triggerToolbarSm =
    size === "sm"
      ? "min-h-[44px] text-[0.65rem] px-2 py-1 rounded-[var(--radius-md)]"
      : "min-h-[44px] text-[0.6875rem] sm:text-meta px-2 py-1 rounded-[var(--radius-md)]";

  const triggerTabBar =
    "h-full min-h-[44px] w-full min-w-0 items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-1 sm:px-2 py-2 text-[0.65rem] leading-tight sm:text-meta font-medium motion-sub border transition-colors";

  const triggerCls = variant === "tabBar" ? triggerTabBar : triggerToolbarSm;

  const itemCls =
    "flex min-h-[44px] w-full items-center justify-start text-left px-3 py-2 text-small text-slate-200 hover:bg-slate-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/60 rounded-sm";

  return (
    <div
      className={
        variant === "tabBar"
          ? "relative flex w-[min(100%,10.5rem)] shrink-0 items-stretch sm:w-[min(100%,12rem)]"
          : "relative shrink-0"
      }
      ref={rootRef}
    >
      <form
        className={variant === "tabBar" ? "flex h-full min-h-[44px] min-w-0 flex-1 flex-col" : "contents"}
        onSubmit={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
      >
        <button
          type="submit"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          className={`${
            variant === "tabBar" ? "flex h-full min-h-[44px] w-full min-w-0 flex-1" : "inline-flex"
          } items-center justify-center gap-0.5 font-medium text-slate-300 hover:text-cyan-100 motion-sub border transition-colors ${triggerCls} ${
            onFeedback ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-200" : "border-transparent hover:border-cyan-500/25"
          } focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/75 focus-visible:ring-offset-2 ${
            variant === "tabBar" ? "focus-visible:ring-offset-slate-800" : "focus-visible:ring-offset-slate-900"
          }`}
        >
          {t("community_support_menu_trigger")}
          <svg
            className={`w-3 h-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </button>
      </form>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full mt-1 min-w-[12rem] rounded-[var(--radius-md)] border border-cyan-500/25 bg-slate-900/98 backdrop-blur-md py-1 shadow-scifi-dropdown z-[120]"
        >
          <Link
            href="/community/feedback"
            role="menuitem"
            prefetch={true}
            onPointerDown={onNavStart}
            onClick={close}
            className={itemCls}
          >
            {t("community_tab_feedback")}
          </Link>
          <Link href="/help" role="menuitem" prefetch={true} onPointerDown={onNavStart} onClick={close} className={itemCls}>
            {t("help_title")}
          </Link>
          <Link
            href="/terms/community-guidelines"
            role="menuitem"
            prefetch={true}
            onPointerDown={onNavStart}
            onClick={close}
            className={itemCls}
          >
            {t("community_guidelines")}
          </Link>
          <Link
            href="/community/activity"
            role="menuitem"
            prefetch={true}
            onPointerDown={onNavStart}
            onClick={close}
            className={itemCls}
          >
            {t("community_activity_open_full")}
          </Link>
        </div>
      )}
    </div>
  );
}
