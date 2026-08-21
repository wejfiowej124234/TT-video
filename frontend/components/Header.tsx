"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useEffect, useState, useCallback, Suspense } from "react";
import WalletStatusMini from "@/components/trust/WalletStatusMini";
import { useTranslation } from "@/components/LocaleProvider";
import { HeaderLanguageSwitcher } from "@/components/header/HeaderLanguageSwitcher";
import { HeaderUserMenu } from "@/components/header/HeaderUserMenu";
import { headerUserMenuVariantFromUtility } from "@/components/header/headerUserMenuNavModel";
import { useHeaderSession } from "@/components/header/headerSession";
import { buildHeaderLoginHref } from "@/lib/headerLoginHref";
import {
  headerBarClassForPathname,
  headerBrandWordmarkClasses,
  headerBrandWordmarkIsActive,
  headerLoginLinkClasses,
  headerMobileNavRailClassForPathname,
  headerNavItemIsActive,
  headerNavLinkClasses,
  headerRegisterPillClasses,
  headerSurfaceKindForPathname,
  headerUtilityVariantForPathname,
  isAdminHeaderPath,
  isAuthL5DarkHeaderPath,
  isCommunityPremiumHeaderPath,
  resolveHeaderBrandHref,
  shouldSuppressGlobalSiteNav,
} from "@/lib/uiSystem";
import { ADMIN_HEADER_RETURN_SITE_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_HEADER_FOCUS_RING_DARK,
  TT_MARKETING_HEADER_FOCUS_RING_LIGHT,
  TT_MARKETING_HEADER_INNER_FRAME,
  TT_MARKETING_NAV_MOBILE_RAIL_INNER,
} from "@/lib/marketingUi";

/** 主导航：Link + prefetch 以达 52 §7.5 满分（路由与导航 5/5）；保留 prefetch: false 处用于登录/注册等 */
const NAV_LINK_PROPS = { prefetch: false } as const;
const NAV_PREFETCH = { prefetch: true } as const;

/** 主导航项：Link prefetch + hover 时再 `router.prefetch` 一道，抢在 idle 预取之前备好 chunk（52 §7.5） */
function NavLink({
  href,
  className,
  children,
  onNavStart,
  focusRingClass,
  active = false,
  title,
  ...rest
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  onNavStart?: () => void;
  focusRingClass: string;
  active?: boolean;
  title?: string;
} & Omit<React.ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children" | "title" | "prefetch" | "onPointerEnter" | "onPointerDown">) {
  const router = useRouter();
  const focusRing = focusRingClass;
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
      aria-current={active ? "page" : undefined}
      prefetch={true}
      title={title}
      onPointerEnter={warm}
      onPointerDown={onNavStart}
      {...rest}
    >
      {children}
    </Link>
  );
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

/** 顶栏登录：returnUrl=当前 pathname+search（站内）；/auth/* 不自指 */
function HeaderLoginNavLink({
  pathname,
  loginClass,
  focusRingClass,
  t,
  router,
}: {
  pathname: string | null;
  loginClass: string;
  focusRingClass: string;
  t: (k: string) => string;
  router: ReturnType<typeof useRouter>;
}) {
  const searchParams = useSearchParams();
  const href = buildHeaderLoginHref(pathname, searchParams);

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
      className={`${loginClass} rounded-sm ${focusRingClass}`}
    >
      {t("header_login")}
    </Link>
  );
}

/** L1 全局壳：顶栏、品牌、全局导航、钱包、登录/注册；多重身份申请汇总在 `/me/identities` */
export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { show: showNavBar, onNavStart } = useNavigatingBar(pathname);
  const { sessionUser, checking, mounted } = useHeaderSession();
  const showSessionSkeleton = mounted && checking;
  const showGuestAuthRail = !mounted || (!checking && !sessionUser);
  const { t } = useTranslation();

  const isTraveltrust = pathname === "/" || pathname?.startsWith("/traveltrust");
  const isAuthL5 = isAuthL5DarkHeaderPath(pathname);
  const isCommunityPremium = isCommunityPremiumHeaderPath(pathname);
  const isDarkSurface = headerSurfaceKindForPathname(pathname) !== "light";
  const headerUtilityVariant = headerUtilityVariantForPathname(pathname);
  const userMenuVariant = headerUserMenuVariantFromUtility(headerUtilityVariant);
  const sessionSkeletonClass = isAuthL5 ? "bg-ref-sun/15" : isDarkSurface ? "bg-white/10" : "bg-ink-100";
  const navLinkClass = (href: string) =>
    headerNavLinkClasses(pathname, headerNavItemIsActive(pathname, href));
  const headerNavFocusRing = isDarkSurface
    ? TT_MARKETING_HEADER_FOCUS_RING_DARK
    : TT_MARKETING_HEADER_FOCUS_RING_LIGHT;
  const isAdminMode = isAdminHeaderPath(pathname);
  const showSiteNav = !shouldSuppressGlobalSiteNav(pathname);

  const nav = (
    <nav className="flex flex-wrap items-center gap-2 sm:gap-2.5">
      <NavLink
        href="/plan"
        active={headerNavItemIsActive(pathname, "/plan")}
        className={navLinkClass("/plan")}
        onNavStart={onNavStart}
        focusRingClass={headerNavFocusRing}
      >
        {t("header_web3Travel")}
      </NavLink>
      <NavLink
        href="/market"
        active={headerNavItemIsActive(pathname, "/market")}
        className={navLinkClass("/market")}
        onNavStart={onNavStart}
        focusRingClass={headerNavFocusRing}
      >
        {t("header_market")}
      </NavLink>
      <NavLink
        href="/did-rank"
        active={headerNavItemIsActive(pathname, "/did-rank")}
        className={navLinkClass("/did-rank")}
        onNavStart={onNavStart}
        focusRingClass={headerNavFocusRing}
      >
        {t("header_didRank")}
      </NavLink>
      <NavLink
        href="/community"
        active={headerNavItemIsActive(pathname, "/community")}
        className={navLinkClass("/community")}
        onNavStart={onNavStart}
        focusRingClass={headerNavFocusRing}
      >
        {t("header_community")}
      </NavLink>
    </nav>
  );

  /* 始终高于全屏弹窗；/traveltrust 用暖墨实心条（marketingUi · 勿 backdrop-blur 混 WebGL） */
  const headerBarClass = headerBarClassForPathname(pathname);

  const brandWordmarkClass = headerBrandWordmarkClasses(pathname);
  const loginClass = headerLoginLinkClasses(pathname);
  const registerPillClass = headerRegisterPillClasses(pathname);
  const mobileNavRailClass = headerMobileNavRailClassForPathname(pathname);

  return (
    <header
      className={headerBarClass}
      data-tt-marketing-header-surface={headerSurfaceKindForPathname(pathname)}
      data-tt-marketing-header-site-nav={showSiteNav ? "1" : "0"}
      {...(isAdminMode ? { "data-tt-admin-header-mode": "1" } : {})}
      data-tt-traveltrust-header-merged-chrome-l5={isTraveltrust ? "0" : "1"}
      {...(isAuthL5 ? { "data-tt-auth-header-l5": "1" } : {})}
      {...(headerUtilityVariant === "authL5" ? { "data-tt-header-utility-l5": "1" } : {})}
    >
      {showNavBar && (
        <div
          className={`absolute left-0 top-0 right-0 h-0.5 ${isAuthL5 ? "bg-ref-sun/55" : "bg-travel-500"}`}
          role="presentation"
          aria-hidden
        />
      )}
      <div
        className={`${TT_MARKETING_HEADER_INNER_FRAME} flex flex-wrap items-center justify-between gap-3 py-3 pointer-events-auto ${
          isCommunityPremium ? "min-h-[4.5rem]" : ""
        }`}
      >
        <div className="flex items-center gap-4">
          {isAdminMode ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-tt-admin-header-identity="1">
              <NavLink
                href="/admin"
                active={pathname === "/admin"}
                className={`${touchTargetLink44Classes} text-body font-semibold text-slate-100 hover:text-ref-sun/95 ${travelFocusRingOffset2Classes}`}
                onNavStart={onNavStart}
                focusRingClass={headerNavFocusRing}
              >
                {t("header_admin_mode_title")}
              </NavLink>
              <span className="hidden text-slate-500 sm:inline" aria-hidden>
                ·
              </span>
              <NavLink
                href="/"
                active={false}
                className={`${ADMIN_HEADER_RETURN_SITE_CLASS} ${travelFocusRingOffset2Classes}`}
                onNavStart={onNavStart}
                focusRingClass={headerNavFocusRing}
                data-tt-admin-return-site-prominent="1"
                title={t("header_admin_return_site_title")}
              >
                {t("header_admin_return_site")}
              </NavLink>
            </div>
          ) : (
            <>
              <NavLink
                href={resolveHeaderBrandHref(pathname)}
                active={headerBrandWordmarkIsActive(pathname)}
                className={brandWordmarkClass}
                onNavStart={onNavStart}
                focusRingClass={headerNavFocusRing}
              >
                TravelTrust
              </NavLink>
              <div className="hidden sm:block">{nav}</div>
            </>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:flex-nowrap">
          <HeaderLanguageSwitcher variant={headerUtilityVariant} />
          {/* Admin 模式：权限来自邮箱会话；顶栏不展示钱包控件（O5 · ①）。 */}
          {!isAdminMode ? (
            <WalletStatusMini
              variant={
                headerUtilityVariant === "authL5"
                  ? "authL5"
                  : headerUtilityVariant === "community"
                    ? "community"
                    : isDarkSurface
                      ? "light"
                      : "dark"
              }
            />
          ) : null}
          {showSessionSkeleton ? (
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full motion-safe:animate-pulse ${sessionSkeletonClass}`}
              aria-busy="true"
              role="status"
              aria-label={t("common_loading")}
            />
          ) : null}
          {sessionUser ? (
            <HeaderUserMenu initialUser={sessionUser} variant={userMenuVariant} />
          ) : null}
          {showGuestAuthRail ? (
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
                    className={`${loginClass} focus-visible:rounded-sm ${headerNavFocusRing}`}
                  >
                    {t("header_login")}
                  </Link>
                }
              >
                <HeaderLoginNavLink
                  pathname={pathname}
                  loginClass={loginClass}
                  focusRingClass={headerNavFocusRing}
                  t={t}
                  router={router}
                />
              </Suspense>
              {!isAdminMode ? (
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
                  className={`${registerPillClass} ${headerNavFocusRing}`}
                >
                  {t("header_register")}
                </Link>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      {showSiteNav ? (
        <div className={`${mobileNavRailClass} ${TT_MARKETING_NAV_MOBILE_RAIL_INNER}`}>{nav}</div>
      ) : null}
    </header>
  );
}
