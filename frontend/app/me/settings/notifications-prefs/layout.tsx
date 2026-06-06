import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.me_settings_notif_prefs_meta_title;
const description = zh.me_settings_notif_prefs_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/me/settings/notifications-prefs",
    languages: {
      "zh-CN": "/me/settings/notifications-prefs",
      en: "/me/settings/notifications-prefs",
      "x-default": "/me/settings/notifications-prefs",
    },
  },
  openGraph: { title, description, type: "website", url: "/me/settings/notifications-prefs" },
  twitter: { card: "summary_large_image", title, description },
};

export default function MeSettingsNotificationsPrefsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
