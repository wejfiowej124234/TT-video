"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TT_HEADER_USER_MENU_L5 } from "@/lib/header/headerUserMenuL5";
import {
  headerWorkspaceContextNavOptions,
  headerWorkspaceContextSwitcherVisible,
} from "@/lib/header/headerWorkspaceContextNavModel";
import {
  publishHubHrefForWorkspaceContext,
  type ActiveWorkspaceContextId,
} from "@/lib/header/activeWorkspaceContext";
import { useActiveWorkspaceContext } from "@/lib/header/useActiveWorkspaceContext";
import { workbenchHrefForWorkspaceContext } from "@/lib/header/workspaceContextWorkbenchNav";
import { PUBLISH_HUB_PATH } from "@/lib/me/publishHubL5";
import { parseIdentitySlotsFromMe } from "@/lib/meIdentitySlots";
export function HeaderWorkspaceContextSwitcher(props: {
  t: (key: string) => string;
  mePayload?: unknown | null;
  onNavigate?: () => void;
}) {
  const { t, mePayload, onNavigate } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const slots = mePayload ? parseIdentitySlotsFromMe(mePayload) : null;
  const options = headerWorkspaceContextNavOptions(slots);
  const visible = headerWorkspaceContextSwitcherVisible(slots);

  const { context, setContext } = useActiveWorkspaceContext(slots);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!visible) return null;

  const activeLabel = t(
    options.find((o) => o.id === context)?.labelKey ?? "header_workspace_context_account",
  );
  const workbenchHref = workbenchHrefForWorkspaceContext(context);

  const selectContext = (next: ActiveWorkspaceContextId) => {
    setContext(next);
    setOpen(false);
    onNavigate?.();
    if (pathname === PUBLISH_HUB_PATH || pathname.startsWith(`${PUBLISH_HUB_PATH}/`)) {
      router.push(publishHubHrefForWorkspaceContext(next));
    }
  };

  return (
    <div
      ref={ref}
      className="w-full px-1 pb-1"
      data-tt-header-workspace-context="1"
      data-tt-active-workspace-context={context}
    >
      <p className={TT_HEADER_USER_MENU_L5.sectionLabel}>{t("header_workspace_context_label")}</p>
      <div className="relative w-full">
        <button
          type="button"
          className={`${TT_HEADER_USER_MENU_L5.item} w-full justify-between ${open ? TT_HEADER_USER_MENU_L5.itemActive : ""}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t("header_workspace_context_label")}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={TT_HEADER_USER_MENU_L5.itemLabel}>{activeLabel}</span>
          <svg
            className={`h-3.5 w-3.5 shrink-0 text-ref-sun/75 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </button>
        {open ? (
          <div
            role="listbox"
            aria-label={t("header_workspace_context_label")}
            className="absolute left-0 right-0 top-full z-10 mt-0.5 flex flex-col gap-0.5 rounded-lg border border-ref-sun/20 bg-[#1a1410]/95 p-1 shadow-strong backdrop-blur-sm"
          >
            {options.map((option) => {
              const active = option.id === context;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`${TT_HEADER_USER_MENU_L5.item} ${active ? TT_HEADER_USER_MENU_L5.itemActive : ""}`}
                  onClick={() => selectContext(option.id)}
                >
                  <span className={TT_HEADER_USER_MENU_L5.itemLabel}>{t(option.labelKey)}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {workbenchHref ? (
        <Link
          href={workbenchHref}
          className={`${TT_HEADER_USER_MENU_L5.item} mt-0.5 ${TT_HEADER_USER_MENU_L5.itemFeatured}`}
          onClick={onNavigate}
          data-tt-header-workspace-context-workbench="1"
        >
          <span className={TT_HEADER_USER_MENU_L5.itemLabel}>
            {t("header_workspace_context_open_workbench", { role: activeLabel })}
          </span>
        </Link>
      ) : null}
    </div>
  );
}
