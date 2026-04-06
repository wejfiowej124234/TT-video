import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.community_tt_meta_title;
const description = zh.community_tt_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/tt",
    languages: {
      "zh-CN": "/community/tt",
      en: "/community/tt",
      "x-default": "/community/tt",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/tt",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function CommunityTtLayout({ children }: { children: React.ReactNode }) {
  return children;
}
