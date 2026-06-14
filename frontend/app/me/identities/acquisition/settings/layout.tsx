import type { Metadata } from "next";
import zh from "@/locales/zh";

export const metadata: Metadata = {
  title: zh.me_acquisition_profile_settings_meta_title,
  description: zh.me_acquisition_profile_settings_meta_description,
  alternates: { canonical: "/me/identities/acquisition/settings" },
};

export default function MeAcquisitionProfileSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
