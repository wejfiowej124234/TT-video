"use client";

import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminObservabilitySectionBackLinks } from "@/components/admin/AdminObservabilitySectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useAdminSchemaPage } from "./useAdminSchemaPage";
import { observabilityPeerRelatedFoldLinks } from "@/lib/admin/adminObservabilityRelatedFoldLinks";
import { ADMIN_HUB_DEPTH_LINK_CARD_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_MOTION_CARD_HOVER_CLASS,
  ADMIN_CONSOLE_JSON_BLOCK_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";
function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className={`mt-1 max-h-72 overflow-auto ${ADMIN_CONSOLE_JSON_BLOCK_CLASS}`}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

/** 70 / 04 §3.5：Schema 迁移与台账只读（须 admin + PostgreSQL）。 */
export function AdminSchemaPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const schemaBucketHeadingId = useId();
  const adminAppliedFiltersDescId = useId();
  const { loading, refreshing, error, itemsNotPlainObjectError, items, meta, appliedFilters } = useAdminSchemaPage();

  /** 仅当 items 已由成功响应确认为普通对象时才派生；null 表示响应未给出 items，不得当作「空桶」处理。 */
  const buckets: [string, unknown][] | null =
    items === null ? null : Object.entries(items).sort(([a], [b]) => a.localeCompare(b));

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_schema_title")}
      subtitle={t("admin_schema_subtitle_l5")}
      headerAside={<AdminObservabilitySectionBackLinks />}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={observabilityPeerRelatedFoldLinks("/admin/schema")}
        ariaLabelKey="admin_observability_hub_related_aria"
        foldSummaryKey="admin_observability_hub_related_fold"
        dataTtFold="obs-schema"
      />
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && meta?.note ? (
        <AdminMetaNoteLink className="mt-4">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_schema_migrations_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminWarmL5Surface
        as="section"
        className="mt-6"
        aria-label={t("admin_schema_migrations_panel_aria")}
        aria-describedby={
          [!loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ") ||
          undefined
        }
      >
        {loading && items === null && !itemsNotPlainObjectError ? (
          <AdminListLoadingStatus message={t("common_loading")} className="text-ink-600" />
        ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : itemsNotPlainObjectError ? (
          <AdminNoticeBanner tone="warning" message={t("admin_schema_itemsNotPlainObject")} />
        ) : buckets === null ? (
          <AdminNoticeBanner tone="info" message={t("admin_schema_itemsAbsent")} />
        ) : buckets.length === 0 ? (
          <AdminListPageEmptyState
            messageKey="admin_schema_empty"
            nextLinks={[
              { href: "/admin/observability", labelKey: "admin_observability_title" },
              { href: "/admin/config", labelKey: "admin_config_hub_title" },
            ]}
          />
        ) : (
          <div
            className={`space-y-8${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
            data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
          >
            {buckets.map(([key, value], i) => {
              const bucketHeadingId = `${schemaBucketHeadingId}-b${i}`;
              return (
                <Link
                  key={key}
                  href="/admin/observability"
                  className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start ${ADMIN_HUB_DEPTH_LINK_CARD_CLASS} ${ADMIN_MOTION_CARD_HOVER_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`}
                  aria-labelledby={bucketHeadingId}
                >
                  <h2 id={bucketHeadingId} className="text-small font-semibold uppercase tracking-wide text-ink-500 font-mono">
                    {key}
                  </h2>
                  <JsonBlock value={value} />
                </Link>
              );
            })}
          </div>
        )}
      </AdminWarmL5Surface>
    </AdminListPageChrome>
  );
}
