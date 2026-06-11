"use client";

/** Auth L5 utility 下拉 · 顶缘高光（无全幅渐变层，避免穿项视觉噪点） */
export function HeaderUtilityMenuL5Chrome() {
  return <span className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-ref-sun/55 to-transparent" aria-hidden />;
}
