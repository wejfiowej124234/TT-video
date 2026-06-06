import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.community_me_likes_meta_title;
const description = zh.community_me_likes_meta_description;

/** `/community/me/likes` 独立列表页 canonical。 */
export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/me/likes",
    languages: {
      "zh-CN": "/community/me/likes",
      en: "/community/me/likes",
      "x-default": "/community/me/likes",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/me/likes",
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
