import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.me_settings_language_meta_title;
const description = zh.me_settings_language_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/me/settings/language",
    languages: {
      "zh-CN": "/me/settings/language",
      en: "/me/settings/language",
      "x-default": "/me/settings/language",
    },
  },
  openGraph: { title, description, type: "website", url: "/me/settings/language" },
  twitter: { card: "summary_large_image", title, description },
};

export default function MeSettingsLanguageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
