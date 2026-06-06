import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.me_settings_data_meta_title;
const description = zh.me_settings_data_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/me/settings/data",
    languages: {
      "zh-CN": "/me/settings/data",
      en: "/me/settings/data",
      "x-default": "/me/settings/data",
    },
  },
  openGraph: { title, description, type: "website", url: "/me/settings/data" },
  twitter: { card: "summary_large_image", title, description },
};

export default function MeSettingsDataLayout({ children }: { children: React.ReactNode }) {
  return children;
}
