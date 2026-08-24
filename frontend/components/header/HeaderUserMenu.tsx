"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState, useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { HeaderUserMenuL5Logout } from "@/components/header/HeaderUserMenuL5Logout";
import { applyLocalLogoutAfterServerOk, postLogout } from "@/lib/apiClient";
import {
  TT_MARKETING_HEADER_FOCUS_RING_DARK,
  TT_MARKETING_HEADER_FOCUS_RING_LIGHT,
  TT_MARKETING_HEADER_MENU_ITEM_FOCUS,
  TT_MARKETING_HEADER_USER_MENU_BTN_AUTH_L5,
  TT_MARKETING_HEADER_USER_MENU_BTN_DARK,
  TT_MARKETING_HEADER_USER_MENU_DROPDOWN_DARK,
  TT_MARKETING_HEADER_USER_MENU_ITEM_DARK,
} from "@/lib/marketingUi";
import { TT_HEADER_USER_MENU_L5 } from "@/lib/header/headerUserMenuL5";
import type { HeaderUserMenuVariant } from "@/components/header/headerUserMenuNavModel";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import { headerUserMenuButtonA11yLabel } from "@/components/header/headerUserMenuButtonA11y";
import { HeaderUtilityMenuL5Chrome } from "@/components/header/HeaderUtilityMenuL5Chrome";
import { HeaderUserMenuItemIcon } from "@/components/header/HeaderUserMenuItemIcon";
import { HeaderUserMenuNavLinks } from "@/components/header/HeaderUserMenuNavLinks";
import { useHeaderUserMenuMeSync } from "@/components/header/useHeaderUserMenuMeSync";
import { emailFromMePayload, publicChromeDisplayName } from "@/lib/publicChromeHygiene";

/** 54-S18：登录后顶栏右侧用户头像 + 下拉（仅在校验 GET /me 有有效用户后由父级挂载；与 `useHeaderSession` 同源）。 */
export function HeaderUserMenu({
  initialUser,
  variant = "light",
}: {
  initialUser: { id: string; nickname?: string | null; avatar_url?: string | null };
  variant?: HeaderUserMenuVariant;
}) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { mePayload, avatarUrl, setAvatarError, avatarError, nickname } = useHeaderUserMenuMeSync(initialUser);

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

  const handleLogout = async () => {
    if (typeof window === "undefined" || logoutBusy) return;
    setLogoutBusy(true);
    try {
      await postLogout();
      applyLocalLogoutAfterServerOk();
      setOpen(false);
      router.push("/");
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("Header postLogout:", err);
      }
    } finally {
      setLogoutBusy(false);
    }
  };

  const isAuthL5 = variant === "authL5";
  const isDark = variant === "dark" || isAuthL5;
  const menuClass = isAuthL5
    ? TT_HEADER_USER_MENU_L5.dropdown
    : isDark
      ? `absolute right-0 top-full mt-1 min-w-[10rem] rounded-[var(--radius-sm)] border py-1 shadow-strong z-[320] ${TT_MARKETING_HEADER_USER_MENU_DROPDOWN_DARK}`
      : "absolute right-0 top-full mt-1 min-w-[10rem] rounded-[var(--radius-sm)] border py-1 shadow-strong z-[320] border-ink-200 bg-white text-ink-800 shadow-soft";
  const buttonClass = isAuthL5
    ? TT_MARKETING_HEADER_USER_MENU_BTN_AUTH_L5
    : isDark
      ? TT_MARKETING_HEADER_USER_MENU_BTN_DARK
      : `flex items-center gap-2 rounded-full ring-2 ring-ink-200 pl-0.5 pr-2.5 py-1 min-h-[44px] min-w-0 max-w-[12rem] sm:max-w-[14rem] bg-white hover:bg-ink-50`;
  const focusRing = isDark ? TT_MARKETING_HEADER_FOCUS_RING_DARK : TT_MARKETING_HEADER_FOCUS_RING_LIGHT;
  const avatarShellClass = isAuthL5
    ? "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ref-sun/12 text-ref-sun ring-1 ring-ref-sun/28"
    : isDark
      ? "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-slate-100"
      : "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-200/80 text-ink-700";
  const nameClass = isDark
    ? "text-small font-medium truncate text-slate-100"
    : "text-small font-medium truncate text-ink-800";
  const chevronClass = isDark
    ? `w-3.5 h-3.5 shrink-0 transition-transform ${isAuthL5 ? "text-ref-sun/80" : "text-slate-300"}`
    : "w-3.5 h-3.5 shrink-0 transition-transform text-ink-600";

  const displayAvatarUrl = avatarUrl ? communityMediaAbsoluteUrlForRender(avatarUrl) : "";
  const showAvatar = Boolean(avatarUrl) && !avatarError;
  const initial = nickname ? nickname.slice(0, 1).toUpperCase() : null;
  const meEmail = emailFromMePayload(mePayload);
  const displayName = publicChromeDisplayName(nickname, meEmail, t("header_userDefaultName"));

  const menuButtonA11y = useMemo(
    () => headerUserMenuButtonA11yLabel(mePayload, locale, t),
    [mePayload, t, locale],
  );

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        data-tt-header-user-menu="1"
        data-tt-header-user-menu-variant={variant}
        onClick={() => setOpen((o) => !o)}
        className={`${buttonClass} ${focusRing} ${open && isAuthL5 ? TT_HEADER_USER_MENU_L5.buttonOpen : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={menuButtonA11y}
        title={menuButtonA11y}
      >
        <span className={avatarShellClass}>
          {showAvatar ? (
            <Image
              src={displayAvatarUrl}
              alt={t("header_userAvatarAlt")}
              fill
              className="object-cover"
              sizes="44px"
              unoptimized={communityMediaNextImageUnoptimized(displayAvatarUrl)}
              onError={() => setAvatarError(true)}
            />
          ) : initial ? (
            <span className={isAuthL5 ? TT_HEADER_USER_MENU_L5.avatarInitial : "text-small font-semibold text-ink-700"}>
              {initial}
            </span>
          ) : (
            <svg className={`h-4 w-4 ${isAuthL5 ? "text-ref-sun/85" : "text-ink-500"}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
        </span>
        <span className={nameClass}>{displayName}</span>
        <svg
          className={`${chevronClass} ${open ? "rotate-180" : ""}`}
          aria-hidden
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          data-tt-header-user-menu-dropdown="1"
          data-tt-header-user-menu-l5={isAuthL5 ? "1" : undefined}
          className={menuClass}
        >
          {isAuthL5 ? <HeaderUtilityMenuL5Chrome /> : null}
          {isAuthL5 ? (
            <div className={TT_HEADER_USER_MENU_L5.panelBody}>
              <HeaderUserMenuNavLinks
                prefetchHref={(href) => router.prefetch(href)}
                t={t}
                locale={locale}
                onNavigate={() => setOpen(false)}
                variant={variant}
                mePayload={mePayload}
                displayName={displayName}
                avatarInitial={initial}
                showAvatar={showAvatar}
                avatarUrl={showAvatar ? displayAvatarUrl : undefined}
                onAvatarError={() => setAvatarError(true)}
              />
              <div className={TT_HEADER_USER_MENU_L5.divider} role="separator" />
              <HeaderUserMenuL5Logout t={t} onDone={() => setOpen(false)} />
            </div>
          ) : (
            <>
              <HeaderUserMenuNavLinks
                prefetchHref={(href) => router.prefetch(href)}
                t={t}
                locale={locale}
                onNavigate={() => setOpen(false)}
                variant={variant}
                mePayload={mePayload}
                displayName={displayName}
                avatarInitial={initial}
                showAvatar={showAvatar}
                avatarUrl={showAvatar ? displayAvatarUrl : undefined}
                onAvatarError={() => setAvatarError(true)}
              />
            <form
              className="block w-full"
              onSubmit={(e) => {
                e.preventDefault();
                void handleLogout();
              }}
            >
              <button
                type="submit"
                disabled={logoutBusy}
                aria-busy={logoutBusy ? true : undefined}
                className={`block w-full text-left px-3 py-2 text-small disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? "text-slate-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/50"
                    : `text-ink-800 hover:bg-ink-100 ${TT_MARKETING_HEADER_MENU_ITEM_FOCUS}`
                }`}
                role="menuitem"
              >
                {t("header_logout")}
              </button>
            </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
