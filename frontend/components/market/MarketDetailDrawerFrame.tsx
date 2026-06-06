"use client";

import type { HTMLAttributes, MouseEventHandler, ReactNode, Ref } from "react";
import {
  marketDetailDrawerPanel,
  marketDetailDrawerPanelStickyLayout,
  marketDetailDrawerScrim,
} from "./marketDetailDrawerClasses";

type DivPassthrough = Record<string, unknown>;

export type MarketDetailDrawerFrameProps = {
  children: ReactNode;
  onRequestClose: () => void;
  panelRef?: Ref<HTMLDivElement>;
  /** Appended after panel base class */
  panelClassName?: string;
  /** `stickyFooter`：中部滚动 + 底栏吸底（订单/向导详情） */
  panelVariant?: "scroll" | "stickyFooter";
  /** Appended after `marketDetailDrawerScrim` */
  scrimClassName?: string;
  rootHtmlProps?: DivPassthrough;
  panelHtmlProps?: DivPassthrough;
} & Pick<
  HTMLAttributes<HTMLDivElement>,
  "role" | "aria-modal" | "aria-labelledby" | "aria-describedby" | "aria-busy"
>;

/**
 * 右侧滑出详情抽屉共用壳：`marketDetailDrawerScrim` + 面板 + 点击分层（与 `marketDetailDrawerClasses` 同源）。
 */
export default function MarketDetailDrawerFrame(props: MarketDetailDrawerFrameProps) {
  const {
    children,
    onRequestClose,
    panelRef,
    panelClassName = "",
    panelVariant = "scroll",
    scrimClassName = "",
    role = "dialog",
    "aria-modal": ariaModal = true,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    "aria-busy": ariaBusy,
    rootHtmlProps,
    panelHtmlProps,
  } = props;
  const scrimCls = [marketDetailDrawerScrim, scrimClassName].filter(Boolean).join(" ");
  const panelBase =
    panelVariant === "stickyFooter" ? marketDetailDrawerPanelStickyLayout : marketDetailDrawerPanel;
  const panelCls = [panelBase, panelClassName].filter(Boolean).join(" ");
  return (
    <div
      className={scrimCls}
      role={role}
      aria-modal={ariaModal}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-busy={ariaBusy}
      onClick={(e) => {
        if (e.target === e.currentTarget) onRequestClose();
      }}
      {...(rootHtmlProps as HTMLAttributes<HTMLDivElement>)}
    >
      <div
        ref={panelRef}
        className={panelCls}
        {...(panelHtmlProps as HTMLAttributes<HTMLDivElement>)}
        onClick={(e) => {
          e.stopPropagation();
          const fn = panelHtmlProps?.onClick;
          if (typeof fn === "function") (fn as MouseEventHandler<HTMLDivElement>)(e);
        }}
      >
        {children}
      </div>
    </div>
  );
}
