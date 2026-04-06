import type { Metadata } from "next";
import zh from "@/locales/zh";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const path = `/community/me/reports/${id}`;
  const title = zh.community_me_report_detail_meta_title;
  const description = zh.community_me_report_detail_meta_description;
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

export default function CommunityMeReportDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
