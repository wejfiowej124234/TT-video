"use client";

import { TravelTrustListingDocPage } from "@/components/traveltrust/cinematic/TravelTrustListingDocPage";
import { useTranslation } from "@/components/LocaleProvider";

const PENDING_ROWS = [
  { id: "entity", labelKey: "listing_contact_entity_label", valueKey: "listing_contact_entity_value" },
  { id: "email", labelKey: "listing_contact_email_label", valueKey: "listing_contact_email_value" },
  { id: "github", labelKey: "listing_contact_github_label", valueKey: "listing_contact_github_value" },
  { id: "telegram", labelKey: "listing_contact_telegram_label", valueKey: "listing_contact_telegram_value" },
] as const;

export function ContactPageMain() {
  const { t } = useTranslation();
  return (
    <TravelTrustListingDocPage
      marker="contact"
      experience="contact"
      kickerKey="listing_contact_kicker"
      titleKey="listing_contact_title"
      statusKey="listing_contact_status"
      leadKey="listing_contact_lead"
      bodyKeys={["listing_contact_body"]}
    >
      <dl className="space-y-3" data-tt-listing-contact-pending="1">
        {PENDING_ROWS.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-[#f4d39a]/18 bg-[#0c0a09]/60 px-4 py-3"
            data-tt-listing-contact-row={row.id}
          >
            <dt className="text-meta font-semibold text-[#f4d39a]/90">{t(row.labelKey)}</dt>
            <dd className="mt-1 text-small text-slate-300/90">{t(row.valueKey)}</dd>
          </div>
        ))}
      </dl>
    </TravelTrustListingDocPage>
  );
}
