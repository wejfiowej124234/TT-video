"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import { TT_MARKETING_HEADER_FOCUS_RING_LIGHT } from "@/lib/marketingUi";

/** 主导航项：Link prefetch + hover 时再 `router.prefetch` 一道，抢在首屏批量预取之前备好 chunk（52 §7.5） */
export function HeaderNavLink({
  href,
  className,
  children,
  onNavStart,
  focusRingClass = TT_MARKETING_HEADER_FOCUS_RING_LIGHT,
}: {
  href: string;
  className: string;
  children: ReactNode;
  onNavStart?: () => void;
  focusRingClass?: string;
}) {
  const router = useRouter();
  const focusRing = `rounded-sm ${focusRingClass}`;
  const warm = useCallback(() => {
    try {
      router.prefetch(href);
    } catch {
      /* noop */
    }
  }, [router, href]);
  const onPointerDownNav = useCallback(() => {
    warm();
    onNavStart?.();
  }, [warm, onNavStart]);
  return (
    <Link
      href={href}
      className={`${className} ${focusRing}`}
      prefetch={true}
      onPointerEnter={warm}
      onPointerDown={onPointerDownNav}
    >
      {children}
    </Link>
  );
}
