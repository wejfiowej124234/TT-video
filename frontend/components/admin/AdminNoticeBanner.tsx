"use client";

import type { ReactNode } from "react";

import {
  ADMIN_NOTICE_INFO_CLASS,
  ADMIN_NOTICE_SUCCESS_CLASS,
  ADMIN_NOTICE_WARNING_CLASS,
  ADMIN_NOTICE_WARNING_LG_CLASS,
} from "@/lib/adminUi";

export type AdminNoticeTone = "warning" | "readonly" | "info" | "success";

const TONE_CLASS: Record<AdminNoticeTone, { md: string; lg: string }> = {
  warning: { md: ADMIN_NOTICE_WARNING_CLASS, lg: ADMIN_NOTICE_WARNING_LG_CLASS },
  readonly: { md: ADMIN_NOTICE_WARNING_CLASS, lg: ADMIN_NOTICE_WARNING_LG_CLASS },
  info: { md: ADMIN_NOTICE_INFO_CLASS, lg: ADMIN_NOTICE_INFO_CLASS },
  success: { md: ADMIN_NOTICE_SUCCESS_CLASS, lg: ADMIN_NOTICE_SUCCESS_CLASS },
};

const TONE_ROLE: Record<AdminNoticeTone, "alert" | "note" | "status"> = {
  warning: "alert",
  readonly: "note",
  info: "status",
  success: "status",
};

/** 非 fetch 类提示：数据形态警告 / 只读范围说明 / 中性 info（HON-03 · VIS-05）。 */
export function AdminNoticeBanner(props: {
  tone: AdminNoticeTone;
  message: ReactNode;
  className?: string;
  id?: string;
  size?: "md" | "lg";
  "data-testid"?: string;
  /** 额外 data-* 锚点（如 phase2 prep banner）。 */
  dataAttrs?: Record<string, string>;
}) {
  const { tone, message, className, id, size = "md", "data-testid": dataTestId, dataAttrs } = props;
  const base = TONE_CLASS[tone][size];

  return (
    <div
      id={id}
      className={className ?? base}
      role={TONE_ROLE[tone]}
      data-tt-admin-notice={tone}
      data-testid={dataTestId}
      {...dataAttrs}
    >
      {typeof message === "string" ? <p>{message}</p> : message}
    </div>
  );
}
