"use client";

import type { ReactNode } from "react";

import { AdminConfigPlatformSubnav } from "@/components/admin/AdminConfigPlatformSubnav";

/** 配置/平台维护子页统一：面包屑 + 相关页折叠。 */
export function AdminConfigPlatformPageShell(props: {
  currentLabelKey: string;
  parent?: { href: string; labelKey: string };
  children: ReactNode;
}) {
  return (
    <>
      <AdminConfigPlatformSubnav currentLabelKey={props.currentLabelKey} parent={props.parent} />
      {props.children}
    </>
  );
}
