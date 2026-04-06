import type { Metadata } from "next";
import CommunityRouteShell from "@/components/community/CommunityRouteShell";
import zh from "@/locales/zh";

const title = zh.community_meta_title;
const description = zh.community_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community",
    languages: {
      "zh-CN": "/community",
      en: "/community",
      "x-default": "/community",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <CommunityRouteShell>{children}</CommunityRouteShell>;
}
