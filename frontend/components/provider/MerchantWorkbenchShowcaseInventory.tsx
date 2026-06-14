"use client";

import Link from "next/link";
import { FOCUS_RING } from "@/components/me/constants";
import type { MerchantWorkbenchShowcaseRow } from "@/lib/provider/providerWorkbenchListingsModel";
import { shouldShowMerchantWorkbenchShowcaseInventory } from "@/lib/provider/providerWorkbenchListingsModel";
import { MERCHANT_STUDIO_HREF } from "@/lib/workspace/workspaceIdentityModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type MerchantWorkbenchShowcaseInventoryProps = {
  t: (key: string) => string;
  rows: MerchantWorkbenchShowcaseRow[];
  loading: boolean;
  error: string | null;
  mutatingId: string | null;
  onRetry: () => void;
  onArchivePublished: (listingId: string) => void;
  onDeleteDraft: (draftId: string) => void;
};

export default function MerchantWorkbenchShowcaseInventory({
  t,
  rows,
  loading,
  error,
  mutatingId,
  onRetry,
  onArchivePublished,
  onDeleteDraft,
}: MerchantWorkbenchShowcaseInventoryProps) {
  if (!loading && !error && !shouldShowMerchantWorkbenchShowcaseInventory(rows)) {
    return null;
  }

  return (
    <div
      className="mb-4"
      data-tt-provider-workbench-showcase-inventory="1"
      aria-label={t("provider_workbench_showcase_inventory_aria")}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-meta font-semibold text-slate-300">{t("provider_workbench_showcase_inventory_title")}</h3>
        <Link
          href={MERCHANT_STUDIO_HREF}
          className={`text-meta font-medium text-ref-sun/85 underline decoration-ref-sun/35 underline-offset-4 hover:text-[#fde9a8] ${FOCUS_RING}`}
          data-tt-provider-workbench-showcase-inventory-new="1"
        >
          {t("provider_workbench_showcase_inventory_new")}
        </Link>
      </div>

      {loading ? (
        <p className="text-meta text-slate-500" role="status">
          {t("provider_workbench_showcase_inventory_loading")}
        </p>
      ) : null}

      {error ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <p className="text-meta text-danger" role="alert">
            {error}
          </p>
          <button type="button" className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`} onClick={() => void onRetry()}>
            {t("common_retry")}
          </button>
        </div>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((row) => {
            const busy = mutatingId === row.id;
            return (
              <li
                key={`${row.kind}-${row.id}`}
                className="flex items-center gap-3 rounded-xl border border-ref-sun/15 bg-ref-sun/[0.03] px-3 py-2.5 sm:px-4"
                data-tt-provider-workbench-showcase-row={row.kind}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-small font-medium text-slate-100 truncate">{row.title}</p>
                  <p className="text-meta text-slate-500 mt-0.5">
                    {row.kind === "published"
                      ? t("provider_workbench_showcase_row_published")
                      : t("provider_workbench_showcase_row_draft")}
                  </p>
                </div>
                {row.kind === "published" ? (
                  <button
                    type="button"
                    disabled={busy}
                    className={`${TT_WORKSPACE_L5.navLink} shrink-0 min-h-[40px] px-3 py-1.5 text-meta disabled:opacity-50 ${FOCUS_RING}`}
                    onClick={() => void onArchivePublished(row.id)}
                    data-tt-provider-workbench-showcase-archive="1"
                  >
                    {busy ? t("provider_workbench_showcase_archiving") : t("provider_workbench_showcase_archive")}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    className={`${TT_WORKSPACE_L5.navLink} shrink-0 min-h-[40px] px-3 py-1.5 text-meta disabled:opacity-50 ${FOCUS_RING}`}
                    onClick={() => void onDeleteDraft(row.id)}
                    data-tt-provider-workbench-showcase-delete-draft="1"
                  >
                    {busy ? t("provider_workbench_showcase_deleting") : t("provider_workbench_showcase_delete_draft")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
