"use client";

import MeOnboardingRouteError from "@/components/me/MeOnboardingRouteError";

export default function MeOnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <MeOnboardingRouteError error={error} reset={reset} />;
}
