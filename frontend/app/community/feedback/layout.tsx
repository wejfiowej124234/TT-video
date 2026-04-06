import type { Metadata } from "next";
import zh from "@/locales/zh";

/** 54-S19：建议与反馈；子 layout 覆父级 `/community` canonical。metadata 惯例取 zh。 */
const title = zh.community_feedback_meta_title;
const description = zh.community_feedback_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/feedback",
    languages: {
      "zh-CN": "/community/feedback",
      en: "/community/feedback",
      "x-default": "/community/feedback",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/feedback",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
