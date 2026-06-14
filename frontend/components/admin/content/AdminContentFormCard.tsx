"use client";

import type { FormHTMLAttributes, ReactNode } from "react";
import { OfficialOpsFormCard } from "@/components/admin/ops/OfficialOpsFormCard";

type Props = FormHTMLAttributes<HTMLFormElement> & {
  titleKey?: string;
  title?: string;
  children: ReactNode;
  dataAttr?: string;
};

/** CMS catalog · 暖金 L5 表单区（复用 Official ops SSOT） */
export function AdminContentFormCard(props: Props) {
  return <OfficialOpsFormCard {...props} />;
}
