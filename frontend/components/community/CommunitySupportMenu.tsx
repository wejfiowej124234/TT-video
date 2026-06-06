"use client";



import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";

import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";



type Props = {

  /** 与壳层 Tab 一致：pointerdown 时触发顶栏进度条 */

  onNavStart?: () => void;

  /** mobile 顶栏第二行略小 */

  size?: "sm" | "md";

  /** 与桌面主 Tab 同一圆角条内：触发器样式与 Tab 对齐 */

  variant?: "toolbar" | "tabBar";

};



type MenuAnchor = {

  mode: "dropdown";

  top: number;

  left: number;

  minWidth: number;

};



type MenuLayout = "sheet" | "dropdown";



const SUPPORT_MENU_SHEET_MQ = "(max-width: 640px)";



/**

 * 「帮助与支持」：建议与反馈、帮助中心、社区规范、完整活动中心 同一下拉。

 * `tabBar`：与动态/发现/…/个人中心同一顶栏行；`toolbar`：独立顶行或移动顶栏第二行。

 * 窄屏 bottom-sheet；宽屏 portal 下拉且左对齐触发器。

 */

export function CommunitySupportMenu({ onNavStart, size = "md", variant = "toolbar" }: Props) {

  const { t } = useTranslation();

  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  const [menuLayout, setMenuLayout] = useState<MenuLayout>("dropdown");

  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);

  const menuId = useId();

  const onFeedback = pathname?.startsWith("/community/feedback") ?? false;



  const close = useCallback(() => {

    setOpen(false);

    setMenuAnchor(null);

  }, []);



  const syncMenuLayout = useCallback(() => {

    if (typeof window === "undefined") return;

    setMenuLayout(window.matchMedia(SUPPORT_MENU_SHEET_MQ).matches ? "sheet" : "dropdown");

  }, []);



  const syncMenuAnchor = useCallback(() => {

    const el = triggerRef.current;

    if (!el || menuLayout === "sheet") {

      setMenuAnchor(null);

      return;

    }

    const rect = el.getBoundingClientRect();

    const minWidth = Math.max(rect.width, 192);

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - minWidth - 8));

    setMenuAnchor({

      mode: "dropdown",

      top: rect.bottom + 4,

      left,

      minWidth,

    });

  }, [menuLayout]);



  useEffect(() => {

    close();

  }, [pathname, close]);



  useEffect(() => {

    syncMenuLayout();

    const mq = window.matchMedia(SUPPORT_MENU_SHEET_MQ);

    const onChange = () => syncMenuLayout();

    mq.addEventListener("change", onChange);

    return () => mq.removeEventListener("change", onChange);

  }, [syncMenuLayout]);



  useLayoutEffect(() => {

    if (!open) return;

    syncMenuAnchor();

    const onReflow = () => syncMenuAnchor();

    window.addEventListener("resize", onReflow);

    window.addEventListener("scroll", onReflow, true);

    return () => {

      window.removeEventListener("resize", onReflow);

      window.removeEventListener("scroll", onReflow, true);

    };

  }, [open, syncMenuAnchor, menuLayout]);



  useEffect(() => {

    if (!open || menuLayout !== "sheet") return;

    const prev = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {

      document.body.style.overflow = prev;

    };

  }, [open, menuLayout]);



  useEffect(() => {

    if (!open) return;

    const onDoc = (e: MouseEvent) => {

      const target = e.target as Node;

      if (rootRef.current?.contains(target)) return;

      if (document.getElementById(menuId)?.contains(target)) return;

      close();

    };

    document.addEventListener("mousedown", onDoc);

    return () => document.removeEventListener("mousedown", onDoc);

  }, [open, close, menuId]);



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



  const itemCls = TT_COMMUNITY_FEED_ACTION.supportMenuItem;



  const menuLinks = (

    <>

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

    </>

  );



  const menuPanel =

    open && typeof document !== "undefined"

      ? menuLayout === "sheet"

        ? createPortal(

            <>

              <button

                type="button"

                className={TT_COMMUNITY_FEED_ACTION.supportMenuScrim}

                aria-label={t("community_close")}

                onClick={close}

              />

              <div

                id={menuId}

                role="menu"

                data-testid="community-support-menu-panel"

                className={TT_COMMUNITY_FEED_ACTION.supportMenuSheet}

              >

                <p className={TT_COMMUNITY_FEED_ACTION.supportMenuSheetTitle}>{t("community_support_menu_trigger")}</p>

                {menuLinks}

              </div>

            </>,

            document.body,

          )

        : menuAnchor

          ? createPortal(

              <div

                id={menuId}

                role="menu"

                data-testid="community-support-menu-panel"

                className={`${TT_COMMUNITY_FEED_ACTION.supportMenuPanel} fixed`}

                style={{

                  top: menuAnchor.top,

                  left: menuAnchor.left,

                  minWidth: menuAnchor.minWidth,

                }}

              >

                {menuLinks}

              </div>,

              document.body,

            )

          : null

      : null;



  return (

    <div

      className={

        variant === "tabBar"

          ? "relative flex w-[min(100%,10.5rem)] shrink-0 items-stretch overflow-visible sm:w-[min(100%,12rem)]"

          : "relative shrink-0 overflow-visible"

      }

      ref={rootRef}

    >

      <form

        className={variant === "tabBar" ? "flex h-full min-h-[44px] min-w-0 flex-1 flex-col overflow-visible" : "contents"}

        onSubmit={(e) => {

          e.preventDefault();

          setOpen((o) => !o);

        }}

      >

        <button

          ref={triggerRef}

          type="submit"

          aria-expanded={open}

          aria-haspopup="menu"

          aria-controls={menuId}

          data-testid="community-support-menu-trigger"

          className={`${

            variant === "tabBar" ? "flex h-full min-h-[44px] w-full min-w-0 flex-1" : "inline-flex"

          } items-center justify-center gap-0.5 font-medium text-slate-300 hover:text-ref-sun/95 motion-sub border transition-colors ${triggerCls} ${

            onFeedback ? "border-ref-sun/30 bg-ref-sun/10 text-ref-sun" : "border-transparent hover:border-ref-sun/22"

          } focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/75 focus-visible:ring-offset-2 ${

            variant === "tabBar" ? "focus-visible:ring-offset-[#0a0a0a]" : "focus-visible:ring-offset-[#0a0a0a]"

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

      {menuPanel}

    </div>

  );

}


