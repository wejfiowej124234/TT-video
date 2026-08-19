"use client";

import { TravelTrustListingDocPage } from "@/components/traveltrust/cinematic/TravelTrustListingDocPage";

export function AssurancePageMain() {
  return (
    <TravelTrustListingDocPage
      marker="assurance"
      experience="assurance"
      kickerKey="listing_assurance_kicker"
      titleKey="listing_assurance_title"
      statusKey="listing_assurance_status"
      leadKey="listing_assurance_lead"
      bodyKeys={[
        "listing_assurance_body",
        "listing_assurance_no_badge",
        "listing_assurance_slot",
      ]}
    />
  );
}
