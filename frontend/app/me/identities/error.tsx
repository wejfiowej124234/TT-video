"use client";

import MeIdentitiesRouteError from "@/components/me/MeIdentitiesRouteError";

export default function MeIdentitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <MeIdentitiesRouteError error={error} reset={reset} />;
}
