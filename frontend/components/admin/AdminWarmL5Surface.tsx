"use client";

import { createElement, type ComponentPropsWithoutRef, type ElementType, type ReactElement, type ReactNode } from "react";

import {
  ADMIN_WARM_L5_FRAME_CLASS,
  ADMIN_WARM_L5_INNER_CLASS,
  ADMIN_WARM_L5_INNER_GLOW_CLASS,
  ADMIN_WARM_L5_PAD_CLASS,
} from "@/lib/adminUi";

type AdminWarmL5SurfaceProps = {
  as?: ElementType;
  className?: string;
  innerClassName?: string;
  /** 默认 `p-4 sm:p-5`；`none` 用于 `<details>` 仅内容区 padding */
  pad?: "default" | "none";
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "as" | "className" | "children">;

/** ① Admin · 首页同源暖金 L5 深玻璃卡（`HOME_FORM_PANEL` / `/orders` 内胆 · cinematic 壳）。 */
export function AdminWarmL5Surface({
  as = "div",
  className = "",
  innerClassName = "",
  pad = "default",
  children,
  ...rest
}: AdminWarmL5SurfaceProps): ReactElement {
  const padClass = pad === "none" ? "relative" : ADMIN_WARM_L5_PAD_CLASS;

  return createElement(
    as,
    {
      className: `${ADMIN_WARM_L5_FRAME_CLASS} ${className}`.trim(),
      "data-tt-admin-warm-l5-surface": "1",
      ...rest,
    },
    createElement(
      "div",
      { className: `${ADMIN_WARM_L5_INNER_CLASS} ${padClass} ${innerClassName}`.trim() },
      createElement("div", { className: ADMIN_WARM_L5_INNER_GLOW_CLASS, "aria-hidden": true }),
      children,
    ),
  );
}
