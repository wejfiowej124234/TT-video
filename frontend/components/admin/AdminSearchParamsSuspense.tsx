"use client";

import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { adminPageNavLinkClass } from "@/lib/adminUi";

const ADMIN_SEARCH_PARAMS_MAIN_DEFAULT =
  "mx-auto flex min-h-[40vh] max-w-6xl flex-col items-center justify-center gap-6 p-6 sm:p-8";

/** Next 15：`useSearchParams` / `useParams` 须在 Suspense 边界内（07 §5.6C / 70） */
function AdminSearchParamsSuspenseFallback({
  ariaLabelKey,
  backLinkLabelKey,
  mainClassName,
}: {
  ariaLabelKey: string;
  backLinkLabelKey: string;
  mainClassName: string;
}) {
  const { t } = useTranslation();
  return (
    <main className={mainClassName} aria-label={t(ariaLabelKey)}>
      <LoadingText />
      <Link
        href="/admin"
        className={adminPageNavLinkClass()}
      >
        {t(backLinkLabelKey)}
      </Link>
    </main>
  );
}

export function AdminSearchParamsSuspense({
  ariaLabelKey,
  backLinkLabelKey = "admin_schema_back",
  mainClassName = ADMIN_SEARCH_PARAMS_MAIN_DEFAULT,
  children,
}: {
  /** 与同页主标题 `t("…")` 键一致，供 fallback 可访问名 */
  ariaLabelKey: string;
  /** 返回 Admin 首页链接文案（社区子域等多用专用 back 键） */
  backLinkLabelKey?: string;
  /** 覆盖默认 `max-w-6xl` 等（如申诉审核页 `max-w-5xl`） */
  mainClassName?: string;
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <AdminSearchParamsSuspenseFallback
          ariaLabelKey={ariaLabelKey}
          backLinkLabelKey={backLinkLabelKey}
          mainClassName={mainClassName}
        />
      }
    >
      {children}
    </Suspense>
  );
}
