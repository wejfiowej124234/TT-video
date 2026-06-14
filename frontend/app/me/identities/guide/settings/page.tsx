"use client";

import { Suspense } from "react";
import MeIdentitiesRouteLoading from "@/components/me/MeIdentitiesRouteLoading";
import { MeGuideProfileSettingsPageInner } from "./MeGuideProfileSettingsPageInner";

export default function MeGuideProfileSettingsPage() {
  return (
    <Suspense fallback={<MeIdentitiesRouteLoading />}>
      <MeGuideProfileSettingsPageInner />
    </Suspense>
  );
}
