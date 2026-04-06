import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.community_friends_meta_title;
const description = zh.community_friends_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/friends",
    languages: {
      "zh-CN": "/community/friends",
      en: "/community/friends",
      "x-default": "/community/friends",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/friends",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function CommunityFriendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
