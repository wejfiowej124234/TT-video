"use client";

import type { ReactNode } from "react";

import { AdminCommunitySubnav } from "@/components/admin/AdminCommunitySubnav";

/** 社区子页统一：相关页折叠（COM-06 · 面包屑见 AdminListPageChrome）。 */
export function AdminCommunityPageShell(props: { children: ReactNode }) {
  return (
    <>
      <AdminCommunitySubnav />
      {props.children}
    </>
  );
}
