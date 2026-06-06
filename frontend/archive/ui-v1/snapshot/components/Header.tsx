"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import WalletStatusMini from "@/components/trust/WalletStatusMini";
import { useTranslation } from "@/components/LocaleProvider";
import { HeaderNavLink } from "@/components/header/HeaderNavLink";
import { useHeaderSession } from "@/components/header/headerSession";
import { useNavigatingBar } from "@/components/header/useNavigatingBar";
import { HeaderUserMenu } from "@/components/header/HeaderUserMenu";
import { HeaderLoginNavLink } from "@/components/header/HeaderLoginNavLink";
import { HeaderLanguageSwitcher } from "@/components/header/HeaderLanguageSwitcher";
import {
  shouldSuppressGlobalSiteNav,
  headerBarClassForPathname,
  headerMobileNavRailClassForPathname,
  headerNavLinkClasses,
  headerSurfaceKindForPathname,
  resolveHeaderBrandHref,
  resolveHeaderBrandLabel,
} from "@/lib/uiSystem";
import {
  TT_MARKETING_HEADER_INNER_FRAME,
  TT_MARKETING_REGISTER_PILL_DARK,
  TT_MARKETING_REGISTER_PILL_LIGHT,
  TT_MARKETING_HEADER_FOCUS_RING_DARK,
  TT_MARKETING_HEADER_FOCUS_RING_LIGHT,
} from "@/lib/marketingUi";

/** L0 全局壳：顶栏、品牌、全局导航、钱包、登录/注册（V2 · marketingUi + uiSystem） */
export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { show: showNavBar, onNavStart } = useNavigatingBar(pathname);
  const { sessionUser, checking, mounted } = useHeaderSession();
  const showSessionSkeleton = mounted && checking;
  const showGuestAuthRail = !mounted || (!checking && !sessionUser);
  const { t } = useTranslation();

  const surfaceKind = headerSurfaceKindForPathname(pathname);
  const isDarkSurface = surfaceKind !== "light";
  const showSiteNav = !shouldSuppressGlobalSiteNav(pathname);

  const isHome = pathname === "/";
  const isMarket = pathname?.startsWith("/market");
  const isDidRank = pathname?.startsWith("/did-rank");
  const isCommunity = pathname?.startsWith("/community");

  const headerBarClass = headerBarClassForPathname(pathname);
  const mobileNavRailClass = headerMobileNavRailClassForPathname(pathname);
  const navLinkClass = (active: boolean) => headerNavLinkClasses(pathname, active);
  const headerNavFocusRing = isDarkSurface
    ? TT_MARKETING_HEADER_FOCUS_RING_DARK
    : TT_MARKETING_HEADER_FOCUS_RING_LIGHT;

  const nav = (
    <nav className="flex items-center gap-4 flex-wrap" data-tt-marketing-header-nav="1">
      <HeaderNavLink href="/" className={navLinkClass(isHome)} onNavStart={onNavStart} focusRingClass={headerNavFocusRing}>
        {t("header_web3Travel")}
      </HeaderNavLink>
      <HeaderNavLink href="/market" className={navLinkClass(!!isMarket)} onNavStart={onNavStart} focusRingClass={headerNavFocusRing}>
        {t("header_market")}
      </HeaderNavLink>
      <HeaderNavLink href="/did-rank" className={navLinkClass(!!isDidRank)} onNavStart={onNavStart} focusRingClass={headerNavFocusRing}>
        {t("header_didRank")}
      </HeaderNavLink>
      <HeaderNavLink href="/community" className={navLinkClass(!!isCommunity)} onNavStart={onNavStart} focusRingClass={headerNavFocusRing}>
        {t("header_community")}
      </HeaderNavLink>
    </nav>
  );

  const brandWordmarkClass = `font-semibold tracking-tight ${navLinkClass(false)}`;
  const loginClass = isDarkSurface
    ? "text-small text-slate-200 hover:text-white"
    : "text-small text-ink-800 hover:text-ink-900";
  const registerPillClass = isDarkSurface ? TT_MARKETING_REGISTER_PILL_DARK : TT_MARKETING_REGISTER_PILL_LIGHT;
  const walletVariant = isDarkSurface ? "light" : "dark";
  const skeletonClass = isDarkSurface ? "bg-white/10" : "bg-ink-100";

  return (
    <header
      className={headerBarClass}
      data-tt-marketing-header-surface={surfaceKind}
      data-tt-marketing-header-site-nav={showSiteNav ? "1" : "0"}
    >
      {showNavBar && (
        <div className="absolute left-0 top-0 right-0 h-0.5 bg-travel-500" role="presentation" aria-hidden />
      )}
      <div className={`${TT_MARKETING_HEADER_INNER_FRAME} py-3 flex flex-wrap items-center justify-between gap-3 pointer-events-auto`}>
        <div className="flex items-center gap-4">
          <HeaderNavLink
            href={resolveHeaderBrandHref(pathname)}
            className={brandWordmarkClass}
            onNavStart={onNavStart}
            focusRingClass={headerNavFocusRing}
          >
            {resolveHeaderBrandLabel(pathname, {
              home: "TravelTrust",
              network: t("traveltrust_title_brand"),
            })}
          </HeaderNavLink>
          {showSiteNav ? <div className="hidden sm:block">{nav}</div> : null}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <HeaderLanguageSwitcher variant={isDarkSurface ? "dark" : "light"} />
          <WalletStatusMini variant={walletVariant} deferConnectToHero={pathname?.startsWith("/traveltrust")} />
          {showSessionSkeleton ? (
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full motion-safe:animate-pulse ${skeletonClass}`}
              aria-busy="true"
              role="status"
              aria-label={t("common_loading")}
            />
          ) : null}
          {sessionUser ? <HeaderUserMenu initialUser={sessionUser} variant={isDarkSurface ? "dark" : "light"} /> : null}
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
                <HeaderLoginNavLink pathname={pathname} loginClass={loginClass} t={t} router={router} focusRingClass={headerNavFocusRing} />
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
                className={`${registerPillClass} ${headerNavFocusRing}`}
              >
                {t("header_register")}
              </Link>
            </>
          ) : null}
        </div>
      </div>
      {showSiteNav ? <div className={mobileNavRailClass}>{nav}</div> : null}
    </header>
  );
}
