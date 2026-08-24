import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AcquisitionListingDetailView } from "@/components/market/AcquisitionListingDetailView";
import { demoAcquisitionListingIds, pickL10n } from "@/lib/marketSubsiteDemo";
import { loadAcquisitionListingPage } from "@/lib/marketSubsiteDetailPageModel";
import { marketSubsiteDemoStudioFallbackEnabled } from "@/lib/marketSubsiteProductionGate";
import { isUuidString } from "@/lib/isUuidString";
import { localeFromAcceptLanguage, localeMessagesFromAcceptLanguage } from "@/lib/pickMetadataLocale";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  if (!marketSubsiteDemoStudioFallbackEnabled()) return [];
  return demoAcquisitionListingIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tid = id.trim();
  const path = `/market/acquisition/${id}`;
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

  const resolved = await loadAcquisitionListingPage(id);
  if (!resolved) {
    return {
      title: `${loc.notFound_title} | TravelTrust`,
      description: loc.notFound_description,
      alternates: { canonical: path },
    };
  }
  const title = `${pickL10n(resolved.listing.title, locale)} | TravelTrust`;
  const description = pickL10n(resolved.listing.summary, locale);
  return {
    title,
    description,
    alternates: { canonical: path, languages: { "zh-CN": path, en: path, "x-default": path } },
    openGraph: { title, description, type: "article", url: path },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AcquisitionListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tid = id.trim();
    if (!tid) notFound();
    if (!marketSubsiteDemoStudioFallbackEnabled() && !isUuidString(tid)) notFound();
    const resolved = await loadAcquisitionListingPage(tid);
    if (!resolved) notFound();
    return <AcquisitionListingDetailView listing={resolved.listing} provenance={resolved.provenance} />;
  } catch {
    notFound();
  }
}
