"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useEffect, useState, useCallback, Suspense } from "react";
import WalletStatusMini from "@/components/trust/WalletStatusMini";
import { useTranslation } from "@/components/LocaleProvider";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";
import { getMe, clearGetMeCache, postLogout, applyLocalLogoutAfterServerOk } from "@/lib/apiClient";
import {
  travelFocusRingCoreClasses,
  travelFocusRingCoreInsetMenuClasses,
  travelFocusRingCoreOffset2WhiteClasses,
} from "@/lib/travelLinkFocus";

/** 主导航：Link + prefetch 以达 52 §7.5 满分（路由与导航 5/5）；保留 prefetch: false 处用于登录/注册等 */
const NAV_LINK_PROPS = { prefetch: false } as const;
const NAV_PREFETCH = { prefetch: true } as const;

/** 主导航项：Link prefetch + hover 时再 `router.prefetch` 一道，抢在 idle 预取之前备好 chunk（52 §7.5） */
function NavLink({
  href,
  className,
  children,
  onNavStart,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  onNavStart?: () => void;
}) {
  const router = useRouter();
  const focusRing = `rounded-sm ${travelFocusRingCoreOffset2WhiteClasses}`;
  const warm = useCallback(() => {
    try {
      router.prefetch(href);
    } catch {
      /* noop */
    }
  }, [router, href]);
  return (
    <Link
      href={href}
      className={`${className} ${focusRing}`}
      prefetch={true}
      onPointerEnter={warm}
      onPointerDown={onNavStart}
    >
      {children}
    </Link>
  );
}

function useHasUser(pathname: string | null) {
  const [hasUser, setHasUser] = useState(false);
  const refresh = useCallback(() => {
    setHasUser(typeof window !== "undefined" && !!localStorage.getItem("traveltrust_user_id"));
  }, []);
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);
  useEffect(() => {
    const onAuthChange = () => refresh();
    window.addEventListener("traveltrust:auth-change", onAuthChange);
    return () => window.removeEventListener("traveltrust:auth-change", onAuthChange);
  }, [refresh]);
  return hasUser;
}

const NAV_BAR_DURATION_MS = 400;

/** 顶栏进度条：pointerdown 即显示（≤200ms 响应），路由变更时也显示，400ms 后隐藏 */
function useNavigatingBar(pathname: string | null) {
  const [show, setShow] = useState(false);
  const prev = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBar = useCallback(() => {
    setShow(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setShow(false);
    }, NAV_BAR_DURATION_MS);
  }, []);

  useEffect(() => {
    if (pathname !== prev.current) {
      prev.current = pathname;
      showBar();
    }
  }, [pathname, showBar]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { show, onNavStart: showBar };
}

/** 54-S18：登录后顶栏右侧用户头像 + 下拉（个人中心、我的订单、设置、退出）；有头像则显示头像，无则首字或默认图标 */
function UserMenu({ hasUser }: { hasUser: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const userMenuMeGen = useRef(0);

  const loadUser = useCallback(() => {
    if (!hasUser) {
      userMenuMeGen.current += 1;
      setAvatarUrl(null);
      setNickname(null);
      setAvatarError(false);
      return;
    }
    const gen = ++userMenuMeGen.current;
    getMe()
      .then((res) => {
        if (gen !== userMenuMeGen.current) return;
        const u = (res as { user?: { avatar_url?: string | null; nickname?: string | null } })?.user;
        setAvatarUrl(u?.avatar_url?.trim() || null);
        setNickname(u?.nickname?.trim() || null);
        setAvatarError(false);
      })
      .catch((err) => {
        if (gen !== userMenuMeGen.current) return;
        if (typeof window !== "undefined") {
          console.error("Header UserMenu getMe:", err);
        }
        setAvatarUrl(null);
        setNickname(null);
      });
  }, [hasUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);
  useEffect(() => {
    const onAuthChange = () => loadUser();
    window.addEventListener("traveltrust:auth-change", onAuthChange);
    return () => window.removeEventListener("traveltrust:auth-change", onAuthChange);
  }, [loadUser]);
  useEffect(() => {
    const onProfileUpdated = () => {
      clearGetMeCache();
      loadUser();
    };
    window.addEventListener("traveltrust:profile-updated", onProfileUpdated);
    return () => window.removeEventListener("traveltrust:profile-updated", onProfileUpdated);
  }, [loadUser]);

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

  if (!hasUser) return null;

  const menuClass = "border-ink-200 bg-white text-ink-800 shadow-soft";

  const showAvatar = avatarUrl && !avatarError;
  const initial = nickname ? nickname.slice(0, 1).toUpperCase() : null;
  const ringClass = "ring-2 ring-ink-200";
  const displayName = nickname && nickname.length > 0 ? nickname : t("header_userDefaultName");

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full ${ringClass} pl-0.5 pr-2.5 py-1 min-h-[44px] min-w-0 max-w-[12rem] sm:max-w-[14rem] bg-white hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("header_userMenu")}
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-200/80 text-ink-700">
          {showAvatar ? (
            <Image
              src={avatarUrl}
              alt={t("header_userAvatarAlt")}
              fill
              className="object-cover"
              sizes="44px"
              unoptimized
              onError={() => setAvatarError(true)}
            />
          ) : initial ? (
            <span className="text-small font-semibold text-ink-700">{initial}</span>
          ) : (
            <svg className="h-4 w-4 text-ink-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
        </span>
        <span className="text-small font-medium truncate text-ink-800">{displayName}</span>
        <svg className={`w-3.5 h-3.5 shrink-0 transition-transform text-ink-600 ${open ? "rotate-180" : ""}`} aria-hidden viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4.5L6 7.5L9 4.5" /></svg>
      </button>
      {open && (
        <div role="menu" className={`absolute right-0 top-full mt-1 min-w-[10rem] rounded-[var(--radius-sm)] border py-1 shadow-strong z-50 ${menuClass}`}>
          <Link href="/me" onClick={() => setOpen(false)} className={`block px-3 py-2 text-small text-ink-800 hover:bg-ink-100 w-full text-left ${travelFocusRingCoreInsetMenuClasses}`} role="menuitem">{t("nav_me")}</Link>
          <Link href="/orders" onClick={() => setOpen(false)} className={`block px-3 py-2 text-small text-ink-800 hover:bg-ink-100 w-full text-left ${travelFocusRingCoreInsetMenuClasses}`} role="menuitem">{t("header_myOrders")}</Link>
          <Link href="/community/feedback" onClick={() => setOpen(false)} className={`block px-3 py-2 text-small text-ink-800 hover:bg-ink-100 w-full text-left ${travelFocusRingCoreInsetMenuClasses}`} role="menuitem">{t("me_link_feedback")}</Link>
          <Link href="/pay" onClick={() => setOpen(false)} className={`block px-3 py-2 text-small text-ink-800 hover:bg-ink-100 w-full text-left ${travelFocusRingCoreInsetMenuClasses}`} role="menuitem">{t("header_payHub")}</Link>
          <Link href="/staking" onClick={() => setOpen(false)} className={`block px-3 py-2 text-small text-ink-800 hover:bg-ink-100 w-full text-left ${travelFocusRingCoreInsetMenuClasses}`} role="menuitem">{t("header_staking")}</Link>
          <Link href="/me/password" onClick={() => setOpen(false)} className={`block px-3 py-2 text-small text-ink-800 hover:bg-ink-100 w-full text-left ${travelFocusRingCoreInsetMenuClasses}`} role="menuitem">{t("header_settings")}</Link>
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
              className={`block w-full text-left px-3 py-2 text-small text-ink-800 hover:bg-ink-100 disabled:opacity-50 disabled:cursor-not-allowed ${travelFocusRingCoreInsetMenuClasses}`}
              role="menuitem"
            >
              {t("header_logout")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/** 顶栏登录：returnUrl=当前 pathname+search（站内）；/auth/* 不自指 */
function HeaderLoginNavLink({
  pathname,
  loginClass,
  t,
  router,
}: {
  pathname: string | null;
  loginClass: string;
  t: (k: string) => string;
  router: ReturnType<typeof useRouter>;
}) {
  const searchParams = useSearchParams();
  const q = searchParams.toString();
  const base = pathname ?? "";
  const returnPath = q ? `${base}?${q}` : base || "/";
  const href = base.startsWith("/auth")
    ? "/auth/login"
    : `/auth/login?returnUrl=${encodeURIComponent(returnPath)}`;

  return (
    <Link
      href={href}
      prefetch
      onPointerEnter={() => {
        try {
          router.prefetch(href);
        } catch {
          /* noop */
        }
      }}
      className={`${loginClass} focus-visible:rounded-sm ${travelFocusRingCoreOffset2WhiteClasses}`}
    >
      {t("header_login")}
    </Link>
  );
}

/** L1 全局壳：顶栏、品牌、全局导航、钱包、登录/注册（无角色选择，角色在注册时选游客或申请向导）；28 截图风格 */
export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { show: showNavBar, onNavStart } = useNavigatingBar(pathname);
  const hasUser = useHasUser(pathname);
  const { t, locale, setLocale } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langOpen) return;
    const close = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [langOpen]);

  useEffect(() => {
    if (!langOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [langOpen]);

  /** 全站顶栏与 TT 社区一致：白底、深色字（ink-900） */
  const linkActive = "font-medium border-b-2 border-ink-900 pb-0.5 text-ink-900";
  const linkInactive = "motion-sub text-ink-900 hover:opacity-80";

  const isHome = pathname === "/";
  const isTraveltrust = pathname?.startsWith("/traveltrust");
  const isMarket = pathname?.startsWith("/market");
  const isDidRank = pathname?.startsWith("/did-rank");
  const isCommunity = pathname?.startsWith("/community");

  const nav = (
    <nav className="flex items-center gap-4 flex-wrap">
      <NavLink href="/" className={isHome ? linkActive : linkInactive} onNavStart={onNavStart}>{t("header_web3Travel")}</NavLink>
      <NavLink href="/market" className={isMarket ? linkActive : linkInactive} onNavStart={onNavStart}>{t("header_market")}</NavLink>
      <NavLink href="/did-rank" className={isDidRank ? linkActive : linkInactive} onNavStart={onNavStart}>{t("header_didRank")}</NavLink>
      <NavLink href="/community" className={isCommunity ? linkActive : linkInactive} onNavStart={onNavStart}>{t("header_community")}</NavLink>
    </nav>
  );

  /* 始终高于所有全屏/半屏弹窗；pointer-events-auto 确保顶栏可点击（不被下层拦截） */
  const headerBarClass =
    "relative sticky top-0 z-[300] border-b border-ink-200 bg-white backdrop-blur-sm pointer-events-auto";

  const brandWordmarkClass = isTraveltrust
    ? `font-semibold tracking-tight ${linkActive}`
    : `font-semibold tracking-tight ${linkInactive}`;

  const loginClass = "text-small text-ink-800 hover:text-ink-900";
  const registerPillClass =
    "rounded-full px-4 py-1.5 text-small font-medium border border-ink-200 bg-white text-ink-900 hover:bg-ink-50 hover:border-ink-300 shadow-sm";

  return (
    <header className={headerBarClass}>
      {showNavBar && (
        <div className="absolute left-0 top-0 right-0 h-0.5 bg-travel-500" role="presentation" aria-hidden />
      )}
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-4">
          <NavLink href="/traveltrust" className={brandWordmarkClass} onNavStart={onNavStart}>
            TravelTrust
          </NavLink>
          <div className="hidden sm:block">{nav}</div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-ink-200 px-2.5 py-1.5 text-meta text-ink-900 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              aria-label={t("header_lang")}
            >
              <span>{LOCALE_LABELS[locale]}</span>
              <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${langOpen ? "rotate-180" : ""}`} aria-hidden="true" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4.5L6 7.5L9 4.5" /></svg>
            </button>
            {langOpen && (
              <ul
                role="listbox"
                className="absolute right-0 top-full mt-1 min-w-[8rem] rounded-[var(--radius-sm)] border border-ink-200 bg-white py-1 shadow-soft z-50"
              >
                {LOCALES.map((loc) => (
                  <li key={loc} role="option" aria-selected={locale === loc}>
                    <form
                      className="contents"
                      onSubmit={(e) => {
                        e.preventDefault();
                        setLocale(loc);
                        setLangOpen(false);
                      }}
                    >
                      <button
                        type="submit"
                        className={`w-full text-left px-3 py-2 text-meta text-ink-900 hover:bg-ink-100 ${travelFocusRingCoreClasses} focus-visible:ring-inset ${locale === loc ? "font-medium" : ""}`}
                      >
                        {LOCALE_LABELS[loc]}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <WalletStatusMini variant="dark" />
          <UserMenu hasUser={hasUser} />
          {!hasUser && (
            <>
              <Suspense
                fallback={
                  <Link
                    href="/auth/login"
                    prefetch
                    onPointerEnter={() => {
                      try {
                        router.prefetch("/auth/login");
                      } catch {
                        /* noop */
                      }
                    }}
                    className={`${loginClass} focus-visible:rounded-sm ${travelFocusRingCoreOffset2WhiteClasses}`}
                  >
                    {t("header_login")}
                  </Link>
                }
              >
                <HeaderLoginNavLink pathname={pathname} loginClass={loginClass} t={t} router={router} />
              </Suspense>
              <Link
                href="/auth/register"
                prefetch
                onPointerEnter={() => {
                  try {
                    router.prefetch("/auth/register");
                  } catch {
                    /* noop */
                  }
                }}
                className={`${registerPillClass} ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("header_register")}
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="sm:hidden border-t border-ink-200 bg-white px-4 py-2">{nav}</div>
    </header>
  );
}
