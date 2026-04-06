import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.community_me_reports_meta_title;
const description = zh.community_me_reports_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/me/reports",
    languages: {
      "zh-CN": "/community/me/reports",
      en: "/community/me/reports",
      "x-default": "/community/me/reports",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/me/reports",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function CommunityMeReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
