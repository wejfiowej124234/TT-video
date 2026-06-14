import type { GuideProfileFormDraft } from "@/lib/guide/guideProfileSettingsModel";
import { parseCommaList } from "@/lib/guide/guideRegisterGeo";

const MAX_LEN_CITY = 100;
const MAX_LEN_BIO = 2000;
const MAX_LEN_HOURLY_RATE = 32;
const MAX_HOURLY_VALUE = 999_999;

const MAX_LEN_PUBLIC_TITLE = 80;

export type GuideProfileSettingsValidationIssue = {
  field: "city" | "countryCode" | "publicTitle" | "bio" | "hourlyRate" | "languages" | "serviceTypes";
  messageKey: string;
};

export function validateGuideProfileForm(form: GuideProfileFormDraft): GuideProfileSettingsValidationIssue[] {
  const issues: GuideProfileSettingsValidationIssue[] = [];

  if (!form.countryCode.trim()) {
    issues.push({ field: "countryCode", messageKey: "me_guide_profile_validation_country_required" });
  }

  if (!form.city.trim()) {
    issues.push({ field: "city", messageKey: "me_guide_profile_validation_city_required" });
  } else if (form.city.trim().length > MAX_LEN_CITY) {
    issues.push({ field: "city", messageKey: "me_guide_profile_validation_city_too_long" });
  }

  if (form.bio.length > MAX_LEN_BIO) {
    issues.push({ field: "bio", messageKey: "me_guide_profile_validation_bio_too_long" });
  }

  const publicTitle = form.publicTitle.trim();
  if (publicTitle.length > MAX_LEN_PUBLIC_TITLE) {
    issues.push({ field: "publicTitle", messageKey: "me_guide_profile_validation_public_title_too_long" });
  }

  const hourly = form.hourlyRate.trim();
  if (hourly) {
    if (hourly.length > MAX_LEN_HOURLY_RATE) {
      issues.push({ field: "hourlyRate", messageKey: "me_guide_profile_validation_hourly_too_long" });
    } else {
      const value = Number(hourly);
      if (!Number.isFinite(value) || value < 0 || value > MAX_HOURLY_VALUE) {
        issues.push({ field: "hourlyRate", messageKey: "me_guide_profile_validation_hourly_invalid" });
      }
    }
  }

  if (parseCommaList(form.languages).length === 0) {
    issues.push({ field: "languages", messageKey: "me_guide_profile_validation_languages_required" });
  }

  if (parseCommaList(form.serviceTypes).length === 0) {
    issues.push({ field: "serviceTypes", messageKey: "me_guide_profile_validation_service_types_required" });
  }

  return issues;
}

export function guideProfileFormSnapshot(form: GuideProfileFormDraft): string {
  return JSON.stringify(form);
}
