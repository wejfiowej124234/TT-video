"use client";

import AuthRouteErrorShell from "@/components/auth/AuthRouteErrorShell";

/**
 * /auth 路由 · 页面级错误边界。
 * 安全：不向用户展示 `error.message`（可能含内部细节）；仅记录控制台。
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AuthRouteErrorShell error={error} reset={reset} dataTtRoot="auth-root" logLabel="Auth page error" />;
}
