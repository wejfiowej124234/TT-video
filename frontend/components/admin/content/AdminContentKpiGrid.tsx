"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_KPI_CARD_IDLE_CLASS } from "@/lib/adminUi";

type KpiProps = {
  labelKey: string;
  value: ReactNode;
};

export function AdminContentKpiTile({ labelKey, value }: KpiProps) {
  const { t } = useTranslation();
  return (
    <div className={ADMIN_KPI_CARD_IDLE_CLASS}>
      <div className="text-body-xs text-ink-500">{t(labelKey)}</div>
      <div className="text-body-l font-semibold text-ink-900">{value}</div>
    </div>
  );
}

export function AdminContentKpiGrid({ children }: { children: ReactNode }) {
  return <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
