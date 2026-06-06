"use client";

import AuthRouteErrorShell from "@/components/auth/AuthRouteErrorShell";

export default function GuideRegisterRouteError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AuthRouteErrorShell
      {...props}
      dataTtRoot="guide-register"
      logLabel="Guide register"
    />
  );
}
