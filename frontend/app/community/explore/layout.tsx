import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.community_explore_meta_title;
const description = zh.community_explore_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/explore",
    languages: {
      "zh-CN": "/community/explore",
      en: "/community/explore",
      "x-default": "/community/explore",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/explore",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function CommunityExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
