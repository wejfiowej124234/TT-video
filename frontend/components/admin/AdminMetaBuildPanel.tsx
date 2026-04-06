"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

export function isAdminMetaRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** `GET /meta` 根 JSON → `{ build }`，供无列表 `meta` 的 Admin 页与 `AdminMetaBuildSection` 对齐。 */
export function metaObjectFromGetMetaRoot(json: unknown): Record<string, unknown> | null {
  if (!isAdminMetaRecord(json)) return null;
  const b = json["build"];
  if (!isAdminMetaRecord(b)) return null;
  return { build: b };
}

type Props = { meta: Record<string, unknown> };

/** 展示列表接口 `meta.build`（与 `GET /meta.build` 同源）。 */
export function AdminMetaBuildPanel({ meta }: Props) {
  const { t } = useTranslation();
  const b = isAdminMetaRecord(meta.build) ? meta.build : null;
  if (!b) {
    return <p className="mt-2 text-small text-ink-500">{t("admin_finance_meta_na")}</p>;
  }
  const sha = typeof b.git_sha === "string" ? b.git_sha : null;
  if (!sha) {
    return <p className="mt-2 text-small text-ink-500">{t("admin_finance_meta_na")}</p>;
  }
  const dep =
    b.deployed_at === null || b.deployed_at === undefined
      ? null
      : typeof b.deployed_at === "string"
        ? b.deployed_at
        : null;
  return (
    <div className="mt-2 space-y-1">
      <p className="font-mono text-small text-ink-800">
        <span className="text-ink-500">{t("admin_observability_build_git_sha")}</span> {sha}
      </p>
      <p className="font-mono text-small text-ink-800">
        <span className="text-ink-500">{t("admin_observability_build_deployed_at")}</span>{" "}
        {dep ?? t("admin_observability_build_deployed_unset")}
      </p>
      <p className="text-meta text-ink-500">{t("admin_observability_build_hint")}</p>
    </div>
  );
}

/** 列表接口 `meta.note` 等左侧 travel 条：**整块**导航 **`/admin/observability`**（与 **`AdminMetaBuildSection`** **`aria-label`** 同键拼接）。 */
export function AdminMetaNoteLink({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Link
      href="/admin/observability"
      className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/60 bg-bg-console/20 py-2 text-left text-small text-ink-600 transition hover:border-travel-400 hover:text-ink-800 ${travelFocusRingOffset2Classes}${className ? ` ${className}` : ""}`}
      aria-label={`${t("admin_finance_meta_build_title")} — ${t("admin_observability_title")}`}
    >
      <span className="block border-l-2 border-travel-400 pl-3 pr-1">{children}</span>
    </Link>
  );
}

type SectionProps = {
  meta: Record<string, unknown> | null;
  loading: boolean;
  error: unknown;
};

export function AdminMetaBuildSection({ meta, loading, error }: SectionProps) {
  const { t } = useTranslation();
  if (loading || error || !meta) return null;
  return (
    <Link
      href="/admin/observability"
      className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-ink-50/80 p-4 text-left text-ink-800 transition hover:border-travel-400 hover:text-travel-700 ${travelFocusRingCoreOffset2WhiteClasses}`}
      aria-label={`${t("admin_finance_meta_build_title")} — ${t("admin_observability_title")}`}
    >
      <h2 className="text-body font-medium text-ink-800">{t("admin_finance_meta_build_title")}</h2>
      <AdminMetaBuildPanel meta={meta} />
    </Link>
  );
}
