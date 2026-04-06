import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.community_guidelines_meta_title;
const description = zh.community_guidelines_meta_description;
const path = "/terms/community-guidelines";

export const metadata: Metadata = {
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

export default function CommunityGuidelinesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
