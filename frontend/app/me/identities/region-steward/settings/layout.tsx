import type { Metadata } from "next";
import zh from "@/locales/zh";

export const metadata: Metadata = {
  title: zh.me_steward_profile_settings_meta_title,
  description: zh.me_steward_profile_settings_meta_description,
  alternates: { canonical: "/me/identities/region-steward/settings" },
};

export default function MeStewardProfileSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
