"use client";

/** Auth L5 暖金场域（`globals.css` · `bg-auth-login-l5-*`）。登录 / 注册 / loading / error 共用。 */
export default function AuthL5PageBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-auth-login-l5-atmosphere" />
      <div
        className="absolute inset-0 motion-safe:opacity-90 motion-reduce:opacity-95 motion-safe:animate-pulse motion-reduce:animate-none"
        style={{ animationDuration: "16s" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_42%,rgba(252,164,124,0.08),transparent_68%)]" />
      </div>
    </div>
  );
}
