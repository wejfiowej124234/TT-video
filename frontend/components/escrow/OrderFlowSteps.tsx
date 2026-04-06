"use client";

import { useCallback, useId, useRef } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  marketCyanPillControlFocusClasses,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

/**
 * 53-S1：OrderFlow 步骤条（13-1 表4、53 §3.2）
 * 八步：草稿 → 向导确认 → 双边确认 → 确认 → 付款 → 完成 → 评分 → 资金释放
 * 状态→步骤映射以 53 附录 B（U3）为准。
 * 步进圆 **`min-h-[44px] min-w-[44px]`** 与 **`pay/loading`**、**`EscrowDetailSkeleton`** 步进槽及 **13/37** 触控目标互证（**`itinerary/new/loading`** 步骤格同系）。
 */
export type OrderFlowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface OrderFlowStepsProps {
  /** 当前步骤 1～8 */
  currentStep: OrderFlowStep;
  /** 可选：订单状态/终态，用于无障碍描述或终态展示 */
  statusLabel?: string;
  /** 53-S4：did = 30-DID 赛博朋克风格（协议控制台区） */
  variant?: "default" | "did";
}

const STEPS: OrderFlowStep[] = [1, 2, 3, 4, 5, 6, 7, 8];

/** 53 §4.6.1 / 37 §2.4：八步与附录 B index 一一对应 */
const STEP_LABEL_KEYS = [
  "order_steps_step_draft",
  "order_steps_step_guide_confirm",
  "order_steps_step_bilateral",
  "order_steps_step_confirm",
  "order_steps_step_pay",
  "order_steps_step_done",
  "order_steps_step_rating",
  "order_steps_step_release",
] as const;

export interface OrderStateInput {
  state?: string;
  status?: string;
  sub_status?: string;
}

/**
 * 将 API 订单状态 + 子状态映射为步骤 1～8（53 附录 B 完整映射表 U3）
 * 若 order 仅有 state/status，sub_status 可选；后端未返回 sub_status 时按主状态推断合理步骤。
 */
export function orderStateToStep(order: OrderStateInput | string): OrderFlowStep {
  const state = typeof order === "string"
    ? (order || "").toLowerCase()
    : (order?.state ?? order?.status ?? "").toLowerCase();
  const sub = typeof order === "string" ? undefined : (order?.sub_status ?? "").toLowerCase().replace(/-/g, "_");

  // 终态：步骤条灰显，当前步显示为 8，文案用 statusLabel
  if (
    state === "cancelled" || state === "canceled" ||
    state === "disputed" ||
    state === "refunded" || state === "partiallyrefunded" || state === "slashed"
  ) {
    return 8;
  }

  // Created
  if (state === "draft" || state === "created" || state === "open") {
    if (sub === "guide_claimed") return 2;
    return 1;
  }

  // Accepted
  if (state === "accepted") {
    if (sub === "confirmed") return 4;
    if (sub === "pending_bilateral" || sub === "guide_claimed") return 3;
    return 3;
  }

  // Escrowed / Funded
  if (state === "escrowed" || state === "funded") return 5;

  // Completed
  if (state === "completed" || state === "released") {
    if (sub === "rating_confirmed") return 8;
    if (sub === "rating_pending") return 7;
    return 6;
  }

  // 兼容旧 4 步：confirmed → 4，funded → 5，completed → 6
  if (state === "confirmed") return 4;
  if (state === "closed") return 8;

  return 1;
}

/** 37 §3.5 / APG：在步骤条内用方向键移动焦点，Tab 仍可逐步进入各步 */
function useStepListKeyboardNav() {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const setItemRef = useCallback((index: number, el: HTMLLIElement | null) => {
    itemRefs.current[index] = el;
  }, []);
  const onStepKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLLIElement>) => {
    const items = itemRefs.current.filter((n): n is HTMLLIElement => n != null);
    if (items.length === 0) return;
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next = Math.min(index + 1, items.length - 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      next = Math.max(index - 1, 0);
    } else if (e.key === "Home") {
      e.preventDefault();
      next = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      next = items.length - 1;
    } else {
      return;
    }
    items[next]?.focus();
  }, []);
  return { setItemRef, onStepKeyDown };
}

export default function OrderFlowSteps({ currentStep, statusLabel, variant = "default" }: OrderFlowStepsProps) {
  const { t } = useTranslation();
  const { setItemRef, onStepKeyDown } = useStepListKeyboardNav();
  const statusRegionId = useId();
  const isDid = variant === "did";
  const navClass = isDid
    ? "flex items-center gap-2 py-3 px-2 rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md overflow-x-auto min-w-0 shadow-scifi-panel-md"
    : "flex items-center gap-2 py-3 px-2 rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console/60 overflow-x-auto min-w-0";
  return (
    <nav
      className="min-w-0"
      style={{ scrollbarGutter: "stable" }}
      aria-label={t("orderFlow_aria")}
      aria-describedby={statusLabel ? statusRegionId : undefined}
    >
      {statusLabel ? (
        <span id={statusRegionId} className="sr-only">
          {statusLabel}
        </span>
      ) : null}
      <ol className={`${navClass} list-none m-0 p-0`}>
        {STEPS.map((step, index) => {
          const isCurrent = step === currentStep;
          const isPast = step < currentStep;
          const key = STEP_LABEL_KEYS[step - 1];
          const stepName = t(key);
          const stepAriaLabel = isPast
            ? `${step}. ${stepName}, ${t("order_flow_step_completed_suffix")}`
            : `${step}. ${stepName}`;
          const stepCircleClass = isDid
            ? isCurrent
              ? "bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400/50 shadow-scifi-step"
              : isPast
                ? "bg-cyan-400/10 text-cyan-300"
                : "bg-slate-700/50 text-slate-300"
            : isCurrent
              ? "bg-travel-500 text-white ring-2 ring-travel-500/30"
              : isPast
                ? "bg-success/15 text-success"
                : "bg-ink-100 text-ink-500";
          const stepFocusRing = isDid
            ? marketCyanPillControlFocusClasses
            : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
          return (
            <li
              key={step}
              ref={(el) => setItemRef(index, el)}
              className={`flex flex-1 items-center min-w-0 shrink-0 basis-0 outline-none rounded-[var(--radius-sm)] ${stepFocusRing}`}
              tabIndex={0}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={stepAriaLabel}
              onKeyDown={(e) => onStepKeyDown(index, e)}
            >
              <div className="flex flex-col items-center flex-1 min-w-[3.5rem]">
                <span className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] h-11 w-11 rounded-full text-small font-medium shrink-0 ${stepCircleClass}`}>
                  {isPast ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step
                  )}
                </span>
                <span
                  className={`mt-1 text-meta truncate max-w-full ${isDid ? (isCurrent ? "text-cyan-300 font-medium" : isPast ? "text-cyan-300" : "text-slate-300") : isCurrent ? "text-ink-900 font-medium" : isPast ? "text-ink-600" : "text-ink-500"}`}
                >
                  {t(key)}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 min-w-[8px] max-w-[24px] h-0.5 rounded-[var(--radius-sm)] mx-0.5 ${step < currentStep ? (isDid ? "bg-cyan-400/40" : "bg-success/40") : isDid ? "bg-slate-600/50" : "bg-ink-200"}`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
