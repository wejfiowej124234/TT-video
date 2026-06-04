"use client";

import { useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
} from "@/lib/adminUi";

import type { SignedUrlTokenRow } from "./adminMediaSignedUrlTokensPageModel";

type TokenSortKey = "created_at" | "expires_at";

type Props = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
  items: SignedUrlTokenRow[];
};

export function AdminMediaSignedUrlTokensTableSection({ loading, error, items }: Props) {
  const { t } = useTranslation();
  const { sort, toggle, ariaSort } = useAdminTableSort<TokenSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "expires_at") return r.expires_at ?? "";
        return r.created_at ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  if (loading || error) return null;

  if (items.length === 0) {
    return (
      <AdminListPageEmptyState
        messageKey="admin_media_signed_url_tokens_empty"
        nextLinks={[
          { href: "/admin/media/access-logs", labelKey: "admin_media_access_logs_title" },
          { href: "/admin/config", labelKey: "admin_config_hub_title" },
        ]}
      />
    );
  }

  return (
    <section
      className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
      aria-label={t("admin_media_signed_url_tokens_table_aria")}
    >
      <table className="min-w-full divide-y divide-ink-100 text-left text-small">
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            <AdminSortableTh
              label={t("admin_media_signed_url_tokens_col_created")}
              ariaSort={ariaSort("created_at")}
              onToggle={() => toggle("created_at")}
            />
            <AdminSortableTh
              label={t("admin_media_signed_url_tokens_col_expires")}
              ariaSort={ariaSort("expires_at")}
              onToggle={() => toggle("expires_at")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_media_signed_url_tokens_col_scope")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_media_signed_url_tokens_col_object")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_media_signed_url_tokens_col_issued")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_media_signed_url_tokens_col_id")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 text-ink-700">
          {sortedItems.map((r, idx) => (
            <tr key={`${r.id ?? "row"}-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
              <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                {r.created_at ?? t("admin_em_dash")}
              </td>
              <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                {r.expires_at ?? t("admin_em_dash")}
              </td>
              <td className="px-3 py-2 font-mono text-meta">{r.url_scope ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta max-w-[14rem] truncate" title={r.object_id}>
                {r.object_id ?? t("admin_em_dash")}
              </td>
              <td className="px-3 py-2 font-mono text-meta whitespace-nowrap max-w-[10rem] truncate" title={r.issued_to}>
                {r.issued_to ?? t("admin_em_dash")}
              </td>
              <td className="px-3 py-2 font-mono text-meta whitespace-nowrap max-w-[10rem] truncate" title={r.id}>
                {r.id ?? t("admin_em_dash")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
