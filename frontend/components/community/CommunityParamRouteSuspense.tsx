"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

const SHELL_BASE =
  "flex min-h-[50vh] max-w-4xl flex-col items-center justify-center gap-6 mx-auto py-8 pb-24 safe-area-pb";

/** 社区子路由：`useSearchParams` / `useParams` 须在 Suspense 内（Next 15 · 07 §5.3B） */
export function CommunityParamRouteSuspenseFallback({
  mainAriaLabelKey,
  horizontalPadding = "px-3",
}: {
  mainAriaLabelKey: string;
  /** 与内页 `main` 横向 padding 对齐（列表类多 `px-3`，详情/会话多 `px-4`） */
  horizontalPadding?: "px-3" | "px-4";
}) {
  const { t } = useTranslation();
  return (
    <main className={`${SHELL_BASE} ${horizontalPadding}`} aria-label={t(mainAriaLabelKey)}>
      <LoadingText />
      <ProductCrossNav
        ariaLabelKey="community_relatedNav_aria"
        showGuides
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400"
        linkClassName="inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline rounded-sm px-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        separatorClassName="text-slate-500"
      />
    </main>
  );
}

export function CommunityParamRouteSuspense({
  children,
  mainAriaLabelKey,
  horizontalPadding = "px-3",
}: {
  children: ReactNode;
  mainAriaLabelKey: string;
  horizontalPadding?: "px-3" | "px-4";
}) {
  return (
    <Suspense
      fallback={
        <CommunityParamRouteSuspenseFallback
          mainAriaLabelKey={mainAriaLabelKey}
          horizontalPadding={horizontalPadding}
        />
      }
    >
      {children}
    </Suspense>
  );
}
