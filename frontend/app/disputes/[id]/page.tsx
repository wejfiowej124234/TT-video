import type { Metadata } from "next";
import zh from "@/locales/zh";
import DisputeDetailPageClient from "./DisputeDetailPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const path = `/disputes/${id}`;
  const title = zh.dispute_detail_meta_title;
  const description = zh.dispute_detail_meta_description;
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        "zh-CN": path,
        en: path,
        "x-default": path,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function DisputeDetailPage() {
  return <DisputeDetailPageClient />;
}
