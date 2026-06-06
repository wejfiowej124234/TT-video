"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";

import { adminShellLinkPrefetchProps } from "@/lib/admin/adminShellPrefetchHref";

type AdminShellPrefetchLinkProps = LinkProps & ComponentPropsWithoutRef<"a">;

function hrefToPrefetchKey(href: LinkProps["href"]): string {
  if (typeof href === "string") return href;
  if (href && typeof href === "object") {
    const pathname = href.pathname ?? "";
    const hash = href.hash ?? "";
    return `${pathname}${hash}`;
  }
  return "";
}

/** Admin 域 Link：pointerdown + hover + Next prefetch 统一预热。 */
export function AdminShellPrefetchLink({ href, ...rest }: AdminShellPrefetchLinkProps) {
  const router = useRouter();
  const prefetchKey = hrefToPrefetchKey(href);
  return (
    <Link href={href} {...adminShellLinkPrefetchProps(router, prefetchKey)} {...rest} />
  );
}
