"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TT_MARKETING_HEADER_FOCUS_RING_LIGHT } from "@/lib/marketingUi";

/** 顶栏登录：returnUrl=当前 pathname+search（站内）；`/auth/login` 显示当前页态不重复链 */
export function HeaderLoginNavLink({
  pathname,
  loginClass,
  t,
  router,
  focusRingClass,
}: {
  pathname: string | null;
  loginClass: string;
  t: (k: string) => string;
  router: ReturnType<typeof useRouter>;
  focusRingClass?: string;
}) {
  const searchParams = useSearchParams();
  const q = searchParams.toString();
  const base = pathname ?? "";
  const returnPath = q ? `${base}?${q}` : base || "/";
  const href = base.startsWith("/auth")
    ? "/auth/login"
    : `/auth/login?returnUrl=${encodeURIComponent(returnPath)}`;

  if (base === "/auth/login") {
    return (
      <span
        className={`${loginClass} opacity-80 cursor-default`}
        aria-current="page"
        data-tt-auth-header-login-current="1"
      >
        {t("header_login")}
      </span>
    );
  }

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
      className={`${loginClass} focus-visible:rounded-sm ${focusRingClass ?? TT_MARKETING_HEADER_FOCUS_RING_LIGHT}`}
    >
      {t("header_login")}
    </Link>
  );
}
