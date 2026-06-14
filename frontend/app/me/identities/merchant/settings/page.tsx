"use client";

import { Suspense } from "react";
import MeIdentitiesRouteLoading from "@/components/me/MeIdentitiesRouteLoading";
import { MeMerchantProfileSettingsPageInner } from "./MeMerchantProfileSettingsPageInner";

export default function MeMerchantProfileSettingsPage() {
  return (
    <Suspense fallback={<MeIdentitiesRouteLoading />}>
      <MeMerchantProfileSettingsPageInner />
    </Suspense>
  );
}
