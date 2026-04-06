import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.community_me_collects_meta_title;
const description = zh.community_me_collects_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/me/collects",
    languages: {
      "zh-CN": "/community/me/collects",
      en: "/community/me/collects",
      "x-default": "/community/me/collects",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/me/collects",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function CommunityMeCollectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
