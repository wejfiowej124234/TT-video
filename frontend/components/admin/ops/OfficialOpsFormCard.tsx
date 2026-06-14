"use client";

import type { FormHTMLAttributes, ReactNode } from "react";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_FILTER_GRID_CLASS, ADMIN_FILTER_TITLE_CLASS } from "@/lib/adminUi";

type Props = FormHTMLAttributes<HTMLFormElement> & {
  titleKey?: string;
  title?: string;
  children: ReactNode;
  dataAttr?: string;
};

/** Official/Growth ops · 暖金 L5 表单区（ADM-UX-VIS-09） */
export function OfficialOpsFormCard({ title, titleKey, children, dataAttr, className = "", ...formProps }: Props) {
  return (
    <form
      {...formProps}
      className={`mb-6 ${ADMIN_FILTER_CARD_CLASS} ${className}`.trim()}
      {...(dataAttr ? { "data-tt-admin-official-ops-form": dataAttr } : {})}
    >
      {title || titleKey ? (
        <h2 className={ADMIN_FILTER_TITLE_CLASS}>{title}</h2>
      ) : null}
      <div className={ADMIN_FILTER_GRID_CLASS}>{children}</div>
    </form>
  );
}
