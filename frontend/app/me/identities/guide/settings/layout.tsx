import type { Metadata } from "next";
import zh from "@/locales/zh";

export const metadata: Metadata = {
  title: zh.me_guide_profile_settings_meta_title,
  description: zh.me_guide_profile_settings_meta_description,
  alternates: { canonical: "/me/identities/guide/settings" },
};

export default function MeGuideProfileSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
