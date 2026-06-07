"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_CONSOLE_SKELETON_LINE_CLASS,
  ADMIN_CONSOLE_SKELETON_BLOCK_CLASS,
  ADMIN_CONSOLE_SKELETON_BTN_CLASS,
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_MOTION_SKELETON_CLASS,
  ADMIN_TABLE_LOADING_SKELETON_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_WARM_L5_FRAME_CLASS,
  TT_ADMIN_PAGE_INNER_DETAIL,
  TT_ADMIN_PAGE_INNER_LIST,
  ADMIN_CONSOLE_SKELETON_HEAD_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_SKELETON_CONTROL_BORDER_CLASS,} from "@/lib/adminUi";
import { AdminSubpageRouteLoadingSlowHint } from "@/components/admin/AdminSubpageRouteLoadingSlowHint";

export type AdminSubpageLoadingVariant =
  | "table-narrow"
  | "table-wide"
  | "workspace"
  | "reviews"
  | "audit"
  | "approvals"
  | "finance"
  | "feeRouter"
  | "regionVault"
  | "observability"
  | "schema"
  | "detail";

function innerClassForVariant(variant: AdminSubpageLoadingVariant): string {
  return variant === "observability" || variant === "detail" ? TT_ADMIN_PAGE_INNER_DETAIL : TT_ADMIN_PAGE_INNER_LIST;
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <section className={`${ADMIN_TABLE_SECTION_CLASS}`} aria-hidden>
      <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
        <thead className="bg-bg-console text-ink-700">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 font-medium">
                <div className={`h-3 w-16 rounded-[var(--radius-sm)] ${ADMIN_CONSOLE_SKELETON_HEAD_CLASS}  ${ADMIN_MOTION_SKELETON_CLASS}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS}`}>
          {Array.from({ length: 8 }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <div className={`h-3 w-full max-w-[8rem] ${ADMIN_CONSOLE_SKELETON_LINE_CLASS} rounded-[var(--radius-sm)]  ${ADMIN_MOTION_SKELETON_CLASS}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** Admin 子页路由 loading：与各 page 首屏壳对齐（07 §五 5.6C / 70）；mainAriaLabelKey 与同页 `h1` 的 `t()` 键一致 */
export default function AdminSubpageRouteLoading({
  variant,
  mainAriaLabelKey = "common_loading",
}: {
  variant: AdminSubpageLoadingVariant;
  mainAriaLabelKey?: string;
}) {
  const { t } = useTranslation();
  const innerClass = innerClassForVariant(variant);

  return (
    <main className={innerClass} role="status" aria-label={t(mainAriaLabelKey)} aria-busy="true">
      <header className={`${ADMIN_WARM_L5_FRAME_CLASS} flex flex-wrap items-center justify-between gap-3 p-5`} aria-hidden>
        <div className="space-y-2">
          <div className={`min-h-[44px] h-11 w-52 max-w-full rounded-[var(--radius-sm)] ${ADMIN_CONSOLE_SKELETON_HEAD_CLASS}  ${ADMIN_MOTION_SKELETON_CLASS}`} />
          <div className={`h-4 w-full max-w-xl ${ADMIN_CONSOLE_SKELETON_LINE_CLASS} rounded-[var(--radius-sm)]  ${ADMIN_MOTION_SKELETON_CLASS}`} />
        </div>
        <div className={`h-4 w-32 ${ADMIN_CONSOLE_SKELETON_LINE_CLASS} rounded-[var(--radius-sm)] ${ADMIN_MOTION_SKELETON_CLASS} shrink-0`} />
      </header>

      {variant === "reviews" && (
        <section className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`} aria-hidden>
          <div className={`h-4 w-16 rounded-[var(--radius-sm)] ${ADMIN_CONSOLE_SKELETON_HEAD_CLASS}  ${ADMIN_MOTION_SKELETON_CLASS}`} />
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`min-h-[44px] h-11 w-28 ${ADMIN_FORM_CONTROL_SM_CLASS} bg-bg-console  ${ADMIN_MOTION_SKELETON_CLASS}`} />
            ))}
            <div className={`w-20 ${ADMIN_CONSOLE_SKELETON_BTN_CLASS} ${ADMIN_MOTION_SKELETON_CLASS}`} />
          </div>
        </section>
      )}

      {variant === "audit" && (
        <section className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`} aria-hidden>
          <div className={`h-5 w-24 rounded-[var(--radius-sm)] ${ADMIN_CONSOLE_SKELETON_HEAD_CLASS}  ${ADMIN_MOTION_SKELETON_CLASS}`} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <div className={`h-3 w-20 ${ADMIN_CONSOLE_SKELETON_LINE_CLASS} rounded-[var(--radius-sm)]  ${ADMIN_MOTION_SKELETON_CLASS}`} />
                <div className={`min-h-[44px] h-11 w-full ${ADMIN_SKELETON_CONTROL_BORDER_CLASS} rounded-[var(--radius-md)]  ${ADMIN_MOTION_SKELETON_CLASS}`} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <div className={`w-20 rounded-[var(--radius-md)] ${ADMIN_CONSOLE_SKELETON_BTN_CLASS} ${ADMIN_MOTION_SKELETON_CLASS}`} />
            <div className={`min-h-[44px] h-11 w-20 rounded-[var(--radius-md)] ${ADMIN_SKELETON_CONTROL_BORDER_CLASS}  ${ADMIN_MOTION_SKELETON_CLASS}`} />
          </div>
        </section>
      )}

      {variant === "approvals" && (
        <section className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`} aria-hidden>
          <div className="flex items-center gap-2">
            <div className={`h-4 w-14 rounded-[var(--radius-sm)] ${ADMIN_CONSOLE_SKELETON_HEAD_CLASS}  ${ADMIN_MOTION_SKELETON_CLASS}`} />
            <div className={`min-h-[44px] h-11 w-40 ${ADMIN_SKELETON_CONTROL_BORDER_CLASS} rounded-[var(--radius-md)]  ${ADMIN_MOTION_SKELETON_CLASS}`} />
          </div>
        </section>
      )}

      {(variant === "finance" || variant === "feeRouter" || variant === "regionVault" || variant === "workspace") && (
        <section
          className={`mt-6 grid gap-4 ${variant === "finance" || variant === "workspace" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}
          aria-hidden
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <article key={i} className={`${ADMIN_WARM_L5_FRAME_CLASS} p-4 space-y-2`}>
              <div className={`h-5 w-32 rounded-[var(--radius-sm)] ${ADMIN_CONSOLE_SKELETON_HEAD_CLASS}  ${ADMIN_MOTION_SKELETON_CLASS}`} />
              <div className={`min-h-[44px] h-11 w-20 ${ADMIN_CONSOLE_SKELETON_LINE_CLASS} rounded-[var(--radius-sm)]  ${ADMIN_MOTION_SKELETON_CLASS}`} />
              {variant === "finance" && i > 0 && (
                <div className={`h-24 w-full rounded-[var(--radius-md)] ${ADMIN_CONSOLE_SKELETON_BLOCK_CLASS} ${ADMIN_MOTION_SKELETON_CLASS}`} />
              )}
            </article>
          ))}
        </section>
      )}

      {(variant === "observability" || variant === "schema") && (
        <section className={`mt-6 ${ADMIN_WARM_L5_FRAME_CLASS} p-4 space-y-6`} aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className={`h-3 w-40 rounded-[var(--radius-sm)] ${ADMIN_CONSOLE_SKELETON_HEAD_CLASS}  ${ADMIN_MOTION_SKELETON_CLASS}`} />
              <div className={`h-32 w-full rounded-[var(--radius-md)] ${ADMIN_CONSOLE_SKELETON_BLOCK_CLASS}  ${ADMIN_MOTION_SKELETON_CLASS}`} />
            </div>
          ))}
        </section>
      )}

      {variant === "table-narrow" && <TableSkeleton cols={5} />}
      {variant === "table-wide" && <TableSkeleton cols={6} />}
      {variant === "reviews" && <TableSkeleton cols={6} />}
      {variant === "audit" && <TableSkeleton cols={5} />}
      {variant === "approvals" && <TableSkeleton cols={6} />}
      {(variant === "feeRouter" || variant === "regionVault") && (
        <div className={ADMIN_TABLE_LOADING_SKELETON_CLASS} aria-hidden>
          <table className="min-w-full border-collapse text-left text-small">
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                {Array.from({ length: variant === "regionVault" ? 7 : 5 }).map((_, i) => (
                  <th key={i} className="px-3 py-2">
                    <div className={`h-3 w-12 rounded-[var(--radius-sm)] ${ADMIN_CONSOLE_SKELETON_HEAD_CLASS}  ${ADMIN_MOTION_SKELETON_CLASS}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS}`}>
              {Array.from({ length: 6 }).map((_, r) => (
                <tr key={r}>
                  {Array.from({ length: variant === "regionVault" ? 7 : 5 }).map((_, c) => (
                    <td key={c} className="px-3 py-2">
                      <div className={`h-3 w-16 ${ADMIN_CONSOLE_SKELETON_LINE_CLASS} rounded-[var(--radius-sm)]  ${ADMIN_MOTION_SKELETON_CLASS}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {variant === "workspace" || variant === "table-wide" ? (
        <>
          <p className="sr-only">{t("admin_capabilities_boot_loading")}</p>
          <AdminSubpageRouteLoadingSlowHint />
        </>
      ) : null}
    </main>
  );
}
