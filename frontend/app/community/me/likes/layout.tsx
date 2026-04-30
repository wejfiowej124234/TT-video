import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.community_me_likes_meta_title;
const description = zh.community_me_likes_meta_description;

/** 旧 `/community/me/likes` 仅重定向；canonical 指向个人中心。 */
export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/me",
    languages: {
      "zh-CN": "/community/me",
      en: "/community/me",
      "x-default": "/community/me",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/me",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function CommunityMeLikesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
