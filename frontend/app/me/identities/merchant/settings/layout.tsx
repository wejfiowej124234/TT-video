import type { Metadata } from "next";
import zh from "@/locales/zh";

export const metadata: Metadata = {
  title: zh.me_merchant_profile_settings_meta_title,
  description: zh.me_merchant_profile_settings_meta_description,
  alternates: { canonical: "/me/identities/merchant/settings" },
};

export default function MeMerchantProfileSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
