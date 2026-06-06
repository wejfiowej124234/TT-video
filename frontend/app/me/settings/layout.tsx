import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.me_settings_meta_title;
const description = zh.me_settings_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/me/settings",
    languages: {
      "zh-CN": "/me/settings",
      en: "/me/settings",
      "x-default": "/me/settings",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/me/settings",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function MeSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
