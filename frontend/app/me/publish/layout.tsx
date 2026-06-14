import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.publish_hub_meta_title;
const description = zh.publish_hub_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/me/publish",
    languages: {
      "zh-CN": "/me/publish",
      en: "/me/publish",
      "x-default": "/me/publish",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/me/publish",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function PublishHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
