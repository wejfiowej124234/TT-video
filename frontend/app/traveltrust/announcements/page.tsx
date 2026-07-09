import type { Metadata } from "next";
import { headers } from "next/headers";
import zh from "@/locales/zh";
import { localeMessagesFromAcceptLanguage } from "@/lib/pickMetadataLocale";
import { TravelTrustAnnouncementsPage } from "@/components/traveltrust/cinematic/TravelTrustAnnouncementsPage";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const t = localeMessagesFromAcceptLanguage(h.get("accept-language"));
  const title = t.traveltrust_announcements_title;
  const description = t.traveltrust_announcements_meta_desc;
  return {
    title,
    description,
    alternates: {
      canonical: "/traveltrust/announcements",
      languages: {
        en: "/traveltrust/announcements",
        "zh-CN": "/traveltrust/announcements",
        "x-default": "/traveltrust/announcements",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/traveltrust/announcements",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function TravelTrustAnnouncementsRoutePage() {
  return <TravelTrustAnnouncementsPage />;
}

/** @internal zh mirror for i18n parity tests */
export const traveltrustAnnouncementsMetadataZh = {
  title: zh.traveltrust_announcements_title,
  description: zh.traveltrust_announcements_meta_desc,
};
