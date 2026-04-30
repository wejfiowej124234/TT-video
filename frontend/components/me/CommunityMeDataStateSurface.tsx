"use client";

import type { FormEvent, ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement, useEffect, useRef } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { DataState, DataStateKind } from "@/lib/dataState";
import { trackCommunityMeDataStateRender } from "@/lib/analytics";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";

type TFunc = (k: string) => string;

const LOADING_SECTION =
  "rounded-[var(--radius-md)] border border-cyan-500/30 bg-ink-800/70 px-6 py-12 text-center";
const INVALID_SECTION =
  "rounded-[var(--radius-md)] border border-dashed border-warning/35 bg-ink-800/50 px-5 py-8 text-center space-y-2";

type Props<T> = {
  state: DataState<T>;
  t: TFunc;
  /** i18n key，默认 common_loading */
  loadingLabelKey?: string;
  /** 覆盖默认加载区（如资料卡骨架） */
  loadingSlot?: ReactNode;
  onRetry?: () => void;
  emptySlot: ReactNode;
  /** 覆盖 invalid 默认壳（例如访客登录卡） */
  invalidSlot?: ReactNode;
  success: (value: T) => ReactNode;
  /** P1：埋点 + DOM `data-tt-community-me-surface` / `data-tt-data-state`（供 E2E / 日志聚合） */
  analyticsSurface?: string;
};

/**
 * `/community/me` 系页面共用：五态分支与加载/错误区视觉一致。
 */
function wrapMeAudit(
  analyticsSurface: string | undefined,
  kind: DataStateKind,
  node: ReactNode
): ReactNode {
  if (!analyticsSurface) return node;
  /** `display:contents` 审计包层在 Playwright `toBeVisible` 下常无盒模型；将 data-tt 合并到单根子节点（与 flex/grid 布局兼容）。 */
  if (isValidElement(node)) {
    return cloneElement(node as ReactElement<Record<string, unknown>>, {
      "data-tt-community-me-surface": analyticsSurface,
      "data-tt-data-state": kind,
    });
  }
  return (
    <div data-tt-community-me-surface={analyticsSurface} data-tt-data-state={kind} className="contents">
      {node}
    </div>
  );
}

export default function CommunityMeDataStateSurface<T>({
  state,
  t,
  loadingLabelKey = "common_loading",
  loadingSlot,
  onRetry,
  emptySlot,
  invalidSlot,
  success,
  analyticsSurface,
}: Props<T>) {
  const lastSig = useRef("");

  useEffect(() => {
    if (!analyticsSurface) return;
    const sig = `${analyticsSurface}::${state.kind}`;
    if (lastSig.current === sig) return;
    lastSig.current = sig;
    trackCommunityMeDataStateRender(analyticsSurface, state.kind, {
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  }, [analyticsSurface, state.kind]);

  switch (state.kind) {
    case "loading":
      return wrapMeAudit(
        analyticsSurface,
        state.kind,
        loadingSlot ?? (
          <section className={LOADING_SECTION} aria-busy="true">
            <p className="text-body text-slate-300" role="status" aria-label={t(loadingLabelKey)}>
              {t(loadingLabelKey)}
            </p>
          </section>
        )
      );
    case "error":
      return wrapMeAudit(
        analyticsSurface,
        state.kind,
        <div className="rounded-[var(--radius-md)] border border-cyan-400/35 bg-ink-800/60 backdrop-blur-md px-4 py-4 shadow-scifi-banner ring-1 ring-white/5 space-y-3">
          <ApiErrorAlert message={state.message} />
          {onRetry ? (
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                onRetry();
              }}
            >
              <button
                type="submit"
                aria-label={t("common_retry")}
                className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
              >
                {t("common_retry")}
              </button>
            </form>
          ) : null}
        </div>
      );
    case "invalid":
      return wrapMeAudit(
        analyticsSurface,
        state.kind,
        invalidSlot ?? (
          <section className={INVALID_SECTION} role="region">
            <p className="text-body text-slate-200">{state.message?.trim() ? state.message : t("community_errorTitle")}</p>
          </section>
        )
      );
    case "empty":
      return wrapMeAudit(analyticsSurface, state.kind, emptySlot);
    case "success":
      return wrapMeAudit(analyticsSurface, state.kind, success(state.value));
  }
}
