"use client";

/**
 * V65 Batch3 Cut B — Enterprise Admin honesty chrome (R049 / R051 / R056 / R015 / R042 / R043).
 * Markers: `ADMIN_ENTERPRISE_HARDENING_MARKERS` in `adminEnterpriseHardeningContract.ts`.
 */

import type { HTMLAttributes, ReactNode } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_ENTERPRISE_HARDENING_MARKERS as M,
  ADMIN_ENTERPRISE_HUB_DATA_SOURCE_TONE_CLASS,
  ADMIN_ENTERPRISE_LIFECYCLE_TONE_CLASS,
  adminEnterpriseDataSourceLabelKey,
  adminEnterpriseLifecycleLabelKey,
  type AdminEnterpriseDataSourceTone,
  type AdminEnterpriseLifecycleTone,
  type AdminEnterpriseTipHonestyKind,
} from "@/lib/admin/adminEnterpriseHardeningContract";
import { ADMIN_TEXT_META_CLASS } from "@/lib/adminUi";

export function AdminEnterpriseLifecycleBadge({
  tone,
  className = "",
}: {
  tone: AdminEnterpriseLifecycleTone;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={`${ADMIN_ENTERPRISE_LIFECYCLE_TONE_CLASS[tone]} ${className}`.trim()}
      {...{ [M.lifecycleBadge]: "1", [M.lifecycleTone]: tone }}
    >
      {t(adminEnterpriseLifecycleLabelKey(tone))}
    </span>
  );
}

export function AdminEnterpriseHubDataSourceStrip({
  tone,
  surface,
  className = "",
}: {
  tone: AdminEnterpriseDataSourceTone;
  surface: string;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs ${ADMIN_ENTERPRISE_HUB_DATA_SOURCE_TONE_CLASS[tone]} ${className}`.trim()}
      role="status"
      {...{
        [M.hubDataSourceStrip]: "1",
        [M.hubDataSourceTone]: tone,
        [M.hubDataSourceSurface]: surface,
      }}
    >
      <p className="font-medium text-inherit">{t(adminEnterpriseDataSourceLabelKey(tone))}</p>
      <p className="mt-0.5 text-slate-300">{t("admin_enterprise_hub_data_source_footnote")}</p>
    </div>
  );
}

export function AdminEnterpriseTipHonestyStrip({
  kind,
  className = "",
}: {
  kind: AdminEnterpriseTipHonestyKind;
  className?: string;
}) {
  const { t } = useTranslation();
  const titleKey =
    kind === "product_fe"
      ? "admin_enterprise_tip_honesty_fe"
      : kind === "product_api"
        ? "admin_enterprise_tip_honesty_api"
        : "admin_enterprise_tip_honesty_declared";
  return (
    <div
      className={`rounded-lg border border-slate-600/50 bg-slate-900/40 px-3 py-2 text-xs text-slate-200 ${className}`.trim()}
      role="note"
      {...{ [M.tipHonestyStrip]: "1", [M.tipHonestyKind]: kind }}
    >
      <p className="font-medium">{t(titleKey)}</p>
      <p className={`mt-0.5 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_enterprise_tip_honesty_footnote")}</p>
    </div>
  );
}

/** R015 + R043 — Content hub surface / submodule-depth honesty. */
export function AdminEnterpriseContentSurfaceHonesty({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={`rounded-lg border border-amber-500/35 bg-amber-950/25 px-3 py-2 text-xs text-amber-50 ${className}`.trim()}
      role="note"
      {...{ [M.contentSurfaceHonesty]: "1", [M.contentDepthHonesty]: "1" }}
    >
      <p className="font-medium">{t("admin_enterprise_content_surface_title")}</p>
      <p className={`mt-0.5 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_enterprise_content_surface_body")}</p>
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_enterprise_content_depth_body")}</p>
    </div>
  );
}

/** R042 — Orders Admin force-readonly honesty. */
export function AdminEnterpriseOrdersReadonlyHonesty({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={`rounded-lg border border-sky-500/35 bg-sky-950/20 px-3 py-2 text-xs text-sky-50 ${className}`.trim()}
      role="note"
      {...{ [M.ordersReadonlyHonesty]: "1" }}
    >
      <p className="font-medium">{t("admin_enterprise_orders_readonly_title")}</p>
      <p className={`mt-0.5 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_enterprise_orders_readonly_body")}</p>
    </div>
  );
}

export function AdminEnterpriseHardeningRoot({
  children,
  className = "",
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">) {
  return (
    <div className={className} {...{ [M.root]: "1" }} {...rest}>
      {children}
    </div>
  );
}
