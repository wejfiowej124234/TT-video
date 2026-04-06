import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.community_activity_meta_title;
const description = zh.community_activity_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/activity",
    languages: {
      "zh-CN": "/community/activity",
      en: "/community/activity",
      "x-default": "/community/activity",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/activity",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function CommunityActivityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
