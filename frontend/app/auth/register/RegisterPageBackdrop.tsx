"use client";

import type { RegisterVisualKind } from "./registerBackgrounds";
import { REGISTER_BG_FALLBACK_CLASS, REGISTER_BG_SRC } from "./registerBackgrounds";

/** 注册页全屏底图：默认浅色渐变；其余角色为 `public/register-bg/*.jpg` + 暗角遮罩（卡片可读） */
export default function RegisterPageBackdrop({ kind }: { kind: RegisterVisualKind }) {
  if (kind === "default") {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-slate-200/90 via-slate-100 to-slate-50 motion-safe:transition-opacity duration-500"
      />
    );
  }
  const src = REGISTER_BG_SRC[kind];
  const fallbackClass = REGISTER_BG_FALLBACK_CLASS[kind];
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className={`absolute inset-0 ${fallbackClass} motion-safe:transition-opacity duration-500`} />
      {/* 装饰性全宽底图，需原生 onError 移除；fill 类背景不宜用 next/image 与 public 动态失败态 */}
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative register backdrop + onError fallback */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover motion-safe:transition-opacity duration-500"
        loading="eager"
        decoding="async"
        onError={(e) => {
          e.currentTarget.remove();
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/52 to-slate-950/75 motion-safe:transition-opacity duration-500" />
    </div>
  );
}
