"use client";

import type { ReactNode } from "react";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
} from "@/lib/adminUi";

type Props = {
  children: ReactNode;
  dataAttr?: string;
  className?: string;
};

/** Official/Growth ops · 筛选/窗口/重载条（暖金 L5） */
export function OfficialOpsFilterBar({ children, dataAttr, className = "" }: Props) {
  return (
    <div
      className={`mb-4 flex flex-wrap items-center gap-3 ${ADMIN_FILTER_CARD_CLASS} ${className}`.trim()}
      {...(dataAttr ? { "data-tt-admin-official-ops-filter": dataAttr } : {})}
    >
      {children}
    </div>
  );
}

export {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
};
