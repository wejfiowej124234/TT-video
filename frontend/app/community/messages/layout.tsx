import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.community_messages_meta_title;
const description = zh.community_messages_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/messages",
    languages: {
      "zh-CN": "/community/messages",
      en: "/community/messages",
      "x-default": "/community/messages",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/messages",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function CommunityMessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
