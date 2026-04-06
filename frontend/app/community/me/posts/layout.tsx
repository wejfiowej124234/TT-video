import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.community_me_posts_meta_title;
const description = zh.community_me_posts_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/me/posts",
    languages: {
      "zh-CN": "/community/me/posts",
      en: "/community/me/posts",
      "x-default": "/community/me/posts",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/me/posts",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function CommunityMePostsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
