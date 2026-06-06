"use client";

import AuthRouteErrorShell from "@/components/auth/AuthRouteErrorShell";

export default function StewardRegisterRouteError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AuthRouteErrorShell
      {...props}
      dataTtRoot="steward-register"
      logLabel="Steward register"
    />
  );
}
