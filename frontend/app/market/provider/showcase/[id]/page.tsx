import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { MerchantShowcaseDetailView } from "@/components/market/MerchantShowcaseDetailView";
import { demoMerchantListingIds, pickL10n } from "@/lib/marketSubsiteDemo";
import { loadMerchantShowcaseListingPage } from "@/lib/marketSubsiteDetailPageModel";
import { marketSubsiteDemoStudioFallbackEnabled } from "@/lib/marketSubsiteProductionGate";
import { isUuidString } from "@/lib/isUuidString";
import { localeFromAcceptLanguage, localeMessagesFromAcceptLanguage } from "@/lib/pickMetadataLocale";

/** 允许任意 UUID 详情；`generateStaticParams` 仅预热内置 slug。 */
export const dynamicParams = true;

export function generateStaticParams() {
  if (!marketSubsiteDemoStudioFallbackEnabled()) return [];
  return demoMerchantListingIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tid = id.trim();
  const path = `/market/provider/showcase/${id}`;
  const h = await headers();
  const accept = h.get("accept-language");
  const loc = localeMessagesFromAcceptLanguage(accept);
  const locale = localeFromAcceptLanguage(accept);

  if (!marketSubsiteDemoStudioFallbackEnabled() && tid && !isUuidString(tid)) {
    return {
      title: `${loc.notFound_title} | TravelTrust`,
      description: loc.notFound_description,
      alternates: { canonical: path },
    };
  }

  const resolved = await loadMerchantShowcaseListingPage(id);
  if (!resolved) {
    return {
      title: `${loc.notFound_title} | TravelTrust`,
      description: loc.notFound_description,
      alternates: { canonical: path },
    };
  }
  const title = `${pickL10n(resolved.listing.title, locale)} | TravelTrust`;
  const description = pickL10n(resolved.listing.subtitle, locale);
  return {
    title,
    description,
    alternates: { canonical: path, languages: { "zh-CN": path, en: path, "x-default": path } },
    openGraph: { title, description, type: "article", url: path },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function MerchantShowcaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tid = id.trim();
  if (!tid) notFound();
  if (!marketSubsiteDemoStudioFallbackEnabled() && !isUuidString(tid)) notFound();
  const resolved = await loadMerchantShowcaseListingPage(tid);
  if (!resolved) notFound();
  return <MerchantShowcaseDetailView listing={resolved.listing} provenance={resolved.provenance} />;
}
