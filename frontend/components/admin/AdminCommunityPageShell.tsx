"use client";

import type { ReactNode } from "react";

import { AdminCommunitySubnav } from "@/components/admin/AdminCommunitySubnav";

/** 社区子页统一：面包屑 + 相关页折叠（COM-06）。 */
export function AdminCommunityPageShell(props: {
  currentLabelKey: string;
  children: ReactNode;
}) {
  return (
    <>
      <AdminCommunitySubnav currentLabelKey={props.currentLabelKey} />
      {props.children}
    </>
  );
}
