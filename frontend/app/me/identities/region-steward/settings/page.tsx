"use client";

import { Suspense } from "react";
import MeIdentitiesRouteLoading from "@/components/me/MeIdentitiesRouteLoading";
import { MeStewardProfileSettingsPageInner } from "./MeStewardProfileSettingsPageInner";

export default function MeStewardProfileSettingsPage() {
  return (
    <Suspense fallback={<MeIdentitiesRouteLoading />}>
      <MeStewardProfileSettingsPageInner />
    </Suspense>
  );
}
