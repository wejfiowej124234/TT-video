import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.me_settings_privacy_meta_title;
const description = zh.me_settings_privacy_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/me/settings/privacy",
    languages: {
      "zh-CN": "/me/settings/privacy",
      en: "/me/settings/privacy",
      "x-default": "/me/settings/privacy",
    },
  },
  openGraph: { title, description, type: "website", url: "/me/settings/privacy" },
  twitter: { card: "summary_large_image", title, description },
};

export default function MeSettingsPrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
