"use client";

import { useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { ADMIN_EMPTY_NEXT_PLATFORM_HUB } from "@/lib/admin/adminListEmptyStateNextLinks";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,} from "@/lib/adminUi";

import type { SecretsMetadataRow } from "./adminSecretsMetadataPageModel";

type SecretsSortKey = "key_alias" | "status" | "updated_at";

type Props = {
  items: SecretsMetadataRow[];
  refreshing?: boolean;
};

export function AdminSecretsMetadataTableSection({ items, refreshing = false }: Props) {
  const { t } = useTranslation();
  const { sort, toggle, ariaSort } = useAdminTableSort<SecretsSortKey>("updated_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "updated_at") return r.updated_at ?? "";
        if (key === "status") return r.status ?? "";
        return r.key_alias ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  if (items.length === 0) {
    return (
      <AdminListPageEmptyState
        messageKey="admin_secrets_meta_empty"
        nextLinks={ADMIN_EMPTY_NEXT_PLATFORM_HUB}
      />
    );
  }

  return (
    <section
      className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
      aria-label={t("admin_secrets_meta_table_aria")}
      data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
    >
      <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            <AdminSortableTh
              label={t("admin_secrets_meta_colAlias")}
              ariaSort={ariaSort("key_alias")}
              onToggle={() => toggle("key_alias")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_secrets_meta_colScope")}
            </th>
            <AdminSortableTh
              label={t("admin_secrets_meta_colStatus")}
              ariaSort={ariaSort("status")}
              onToggle={() => toggle("status")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_secrets_meta_colLastRot")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_secrets_meta_colNextDue")}
            </th>
            <AdminSortableTh
              label={t("admin_secrets_meta_colUpdated")}
              ariaSort={ariaSort("updated_at")}
              onToggle={() => toggle("updated_at")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_secrets_meta_colNotes")}
            </th>
          </tr>
        </thead>
        <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
          {sortedItems.map((r, idx) => (
            <tr key={r.id ?? `skm-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{r.key_alias ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{r.env_scope ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{r.status ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{r.last_rotated_at ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{r.next_rotation_due ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{r.updated_at ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 max-w-xs truncate" title={r.notes ?? ""}>
                {r.notes ?? t("admin_em_dash")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
