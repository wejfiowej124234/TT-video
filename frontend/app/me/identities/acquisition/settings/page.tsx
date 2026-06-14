"use client";

import { Suspense } from "react";
import MeIdentitiesRouteLoading from "@/components/me/MeIdentitiesRouteLoading";
import { MeAcquisitionProfileSettingsPageInner } from "./MeAcquisitionProfileSettingsPageInner";

export default function MeAcquisitionProfileSettingsPage() {
  return (
    <Suspense fallback={<MeIdentitiesRouteLoading />}>
      <MeAcquisitionProfileSettingsPageInner />
    </Suspense>
  );
}
