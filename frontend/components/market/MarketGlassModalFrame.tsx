"use client";

import type { HTMLAttributes, MouseEventHandler, ReactNode, Ref } from "react";

/** 宿主可传 `data-testid`、`data-tt-*`、可选事件；由壳内断言为 div 属性后展开 */
type DivPassthrough = Record<string, unknown>;
import {
  marketStudioModalPanelClass,
  marketStudioModalPortalRootClass,
  marketStudioModalScrimClass,
} from "./marketStudioModalLayout";

export type MarketGlassModalFrameProps = {
  children: ReactNode;
  onRequestClose: () => void;
  panelRef?: Ref<HTMLDivElement>;
  /** Appended after `marketStudioModalPanelClass` */
  panelClassName?: string;
  /** Appended after `marketStudioModalScrimClass`（如 `motion-sub`） */
  scrimClassName?: string;
  /** Override portal root layout (default: market glass z-[400]) */
  rootClassName?: string;
  rootHtmlProps?: DivPassthrough;
  panelHtmlProps?: DivPassthrough;
} & Pick<HTMLAttributes<HTMLDivElement>, "role" | "aria-modal" | "aria-labelledby" | "aria-describedby">;

/**
 * 市场系玻璃弹窗共用壳：portal 根 + 遮罩 + 面板（与 `marketStudioModalLayout` 同源 class）。
 * 宿主负责 `useFocusTrap`、`aria-*` 与内容区；本组件只统一点击分层与 `stopPropagation`。
 */
export default function MarketGlassModalFrame(props: MarketGlassModalFrameProps) {
  const {
    children,
    onRequestClose,
    panelRef,
    panelClassName = "",
    rootClassName,
    role = "dialog",
    "aria-modal": ariaModal = true,
    "aria-labelledby": ariaLabelledby,
    "aria-describedby": ariaDescribedby,
    scrimClassName = "",
    rootHtmlProps,
    panelHtmlProps,
  } = props;
  const rootCls = rootClassName ?? marketStudioModalPortalRootClass;
  const panelCls = [marketStudioModalPanelClass, panelClassName].filter(Boolean).join(" ");
  const scrimCls = [marketStudioModalScrimClass, scrimClassName].filter(Boolean).join(" ");
  return (
    <div
      className={rootCls}
      role={role}
      aria-modal={ariaModal}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      onClick={(e) => {
        if (e.target === e.currentTarget) onRequestClose();
      }}
      {...(rootHtmlProps as HTMLAttributes<HTMLDivElement>)}
    >
      <div className={scrimCls} aria-hidden onClick={onRequestClose} />
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
