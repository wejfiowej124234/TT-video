"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import {
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_META_NOTE_LINK_CLASS,
  ADMIN_META_BUILD_FOLD_CARD_CLASS,
  ADMIN_META_BUILD_GIT_UNKNOWN_CLASS,
  ADMIN_META_NOTE_ACCENT_BORDER_CLASS,
  ADMIN_MOTION_CARD_HOVER_CLASS,
  ADMIN_TEXT_META_CLASS,
} from "@/lib/adminUi";

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
  const sha = typeof b.git_sha === "string" ? b.git_sha.trim() : null;
  const shaKnown = !!sha && sha !== "unknown";
  if (!shaKnown) {
    return (
      <div className={ADMIN_META_BUILD_GIT_UNKNOWN_CLASS} data-tt-admin-build-git-unknown="1" role="status">
        <p className="font-medium text-ink-700">{t("admin_meta_build_git_unknown")}</p>
        <p className={`mt-1 ${ADMIN_TEXT_META_CLASS} text-ink-600`}>{t("admin_meta_build_git_unknown_hint")}</p>
      </div>
    );
  }
  const dep =
    b.deployed_at === null || b.deployed_at === undefined
      ? null
      : typeof b.deployed_at === "string"
        ? b.deployed_at
        : null;
  return (
    <div className="mt-2 space-y-1">
      <p className={`font-mono text-small text-ink-800 ${ADMIN_TEXT_META_CLASS}`}>
        <span className="text-ink-500">{t("admin_observability_build_git_sha")}</span> {sha}
      </p>
      <p className={`font-mono text-small text-ink-800 ${ADMIN_TEXT_META_CLASS}`}>
        <span className="text-ink-500">{t("admin_observability_build_deployed_at")}</span>{" "}
        {dep ?? t("admin_observability_build_deployed_unset")}
      </p>
      <p className={`text-meta text-ink-500 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_meta_build_dev_path")}</p>
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
      className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start ${ADMIN_META_NOTE_LINK_CLASS} ${ADMIN_MOTION_CARD_HOVER_CLASS} ${travelFocusRingOffset2Classes}${className ? ` ${className}` : ""}`}
      aria-label={`${t("admin_finance_meta_build_title")} — ${t("admin_observability_title")}`}
    >
      <span className={`block ${ADMIN_META_NOTE_ACCENT_BORDER_CLASS}`}>{children}</span>
    </Link>
  );
}

type SectionProps = {
  meta: Record<string, unknown> | null;
  loading: boolean;
  error: unknown;
  /** 首页 tech fold 内嵌时可设为 true，避免双层折叠。 */
  inline?: boolean;
};

export function AdminMetaBuildSection({ meta, loading, error, inline = false }: SectionProps) {
  const { t } = useTranslation();
  if (loading || error || !meta) return null;

  const panel = (
    <>
      <AdminMetaBuildPanel meta={meta} />
      <Link
        href="/admin/observability"
        className={`${touchTargetLink44Classes} mt-3 inline-block text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
        data-tt-admin-meta-build-observability-link="1"
      >
        {t("admin_meta_build_link_observability")}
      </Link>
    </>
  );

  if (inline) {
    return (
      <div className={`${ADMIN_META_BUILD_FOLD_CARD_CLASS}`} data-tt-admin-meta-build-inline="1">
        <h2 className="text-body font-medium text-ink-800">{t("admin_finance_meta_build_title")}</h2>
        {panel}
      </div>
    );
  }

  return (
    <details
      className={`${ADMIN_META_BUILD_FOLD_CARD_CLASS} ${travelFocusRingCoreOffset2WhiteClasses}`}
      data-tt-admin-meta-build-fold="1"
      data-tt-admin-meta-build-default-open="0"
    >
      <summary
        className={`${touchTargetLink44Classes} cursor-pointer list-none text-body font-medium text-ink-800 marker:content-none [&::-webkit-details-marker]:hidden ${travelFocusRingOffset2Classes}`}
      >
        {t("admin_meta_build_fold_summary")}
      </summary>
      <div className="mt-2">{panel}</div>
    </details>
  );
}
