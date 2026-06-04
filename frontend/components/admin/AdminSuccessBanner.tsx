"use client";

import type { ReactNode } from "react";

import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";

/** 写操作成功反馈（HON-03 · role=status）。 */
export function AdminSuccessBanner(props: { message: ReactNode; className?: string }) {
  const { message, className } = props;

  return (
    <AdminNoticeBanner
      tone="success"
      message={message}
      className={className}
      dataAttrs={{ "data-tt-admin-success-notice": "1" }}
    />
  );
}
