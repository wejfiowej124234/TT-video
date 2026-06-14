import type { Locale } from "@/lib/i18n";
import { resolveApiUploadUrl } from "@/lib/me/resolveApiUploadUrl";
import type { DemoAcquisitionListing, DemoMerchantListing, MerchantCategorySlug } from "@/lib/marketSubsiteDemo";
import type { ProductCountryIso } from "@/lib/productCountries";

const DEFAULT_MERCHANT_IMAGE =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80";
const DEFAULT_ACQUISITION_IMAGE =
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80";

function l10n(text: string): { zh: string; en: string } {
  const v = text.trim();
  return { zh: v, en: v };
}

function parseCategorySlug(raw: string): MerchantCategorySlug {
  const s = raw.trim().toLowerCase();
  if (s === "hotel" || s === "dining" || s === "attraction" || s === "experience") return s;
  return "experience";
}

export function merchantProfileToDemoListing(input: {
  shopName: string;
  city: string;
  countryCode: string;
  categories: string[];
  bio: string;
  coverUrl?: string;
  avatarUrl?: string;
}): DemoMerchantListing {
  const shop = input.shopName.trim() || "Preview Shop";
  const city = input.city.trim() || "—";
  const bio = input.bio.trim() || "—";
  const categoryLabel = input.categories.join(", ").trim() || "—";
  const countryIso = (input.countryCode.trim().toUpperCase() || "CN") as ProductCountryIso;

  return {
    id: "preview-merchant",
    countryIso,
    categorySlug: parseCategorySlug(input.categories[0] ?? "experience"),
    sortKey: 0,
    title: l10n(shop),
    subtitle: l10n(bio),
    city: l10n(city),
    category: l10n(categoryLabel),
    shopName: l10n(shop),
    imageSrc: resolveApiUploadUrl(input.coverUrl) || resolveApiUploadUrl(input.avatarUrl) || DEFAULT_MERCHANT_IMAGE,
    priceUsdc: 0,
    story: [],
    highlights: [],
  };
}

export function acquisitionProfileToDemoListing(input: {
  tagline: string;
  publicBio: string;
  avatarUrl?: string;
  locale: Locale;
}): DemoAcquisitionListing {
  const title = input.tagline.trim() || (input.locale === "zh" ? "收购预览" : "Acquisition preview");
  const summary = input.publicBio.trim() || "—";

  return {
    id: "preview-acquisition",
    destinationCountryIso: "CN",
    categorySlug: "luxury",
    sortKey: 0,
    title: l10n(title),
    summary: l10n(summary),
    route: l10n(input.locale === "zh" ? "全球" : "Global"),
    bountyMinUsdc: 50,
    bountyMaxUsdc: 500,
    deadlineNote: l10n(input.locale === "zh" ? "预览" : "Preview"),
    imageSrc: resolveApiUploadUrl(input.avatarUrl) || DEFAULT_ACQUISITION_IMAGE,
    inspectionStandard: l10n("—"),
    authenticity: l10n("—"),
    condition: l10n("—"),
    rejections: l10n("—"),
    handoff: l10n("—"),
    story: [],
  };
}
