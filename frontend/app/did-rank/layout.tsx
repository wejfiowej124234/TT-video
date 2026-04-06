import type { Metadata } from "next";
import { headers } from "next/headers";
import { localeMessagesFromAcceptLanguage } from "@/lib/pickMetadataLocale";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const t = localeMessagesFromAcceptLanguage(h.get("accept-language"));
  const title = t.didRank_meta_title;
  const description = t.didRank_meta_description;
  return {
    alternates: {
      canonical: "/did-rank",
      languages: {
        "zh-CN": "/did-rank",
        en: "/did-rank",
        "x-default": "/did-rank",
      },
    },
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: "/did-rank",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function DidRankLayout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>;
}
