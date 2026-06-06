"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** 经营查阅子域顶栏：页内交叉链 → 可观测枢纽（收件箱/工作台见面包屑 · batch57）。 */
export function AdminOpsQueueBackLinks({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <>
      {children}
      <Link
        href="/admin/observability"
        className={adminPageNavLinkClass()}
        data-tt-admin-back-observability-hub="1"
      >
        {t("admin_observability_title")}
      </Link>
    </>
  );
}
