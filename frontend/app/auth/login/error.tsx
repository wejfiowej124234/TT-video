"use client";

import AuthRouteErrorShell from "@/components/auth/AuthRouteErrorShell";

export default function AuthRouteSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AuthRouteErrorShell
      {...props}
      dataTtRoot="auth-login"
      logLabel={"Auth login"}
    />
  );
}
