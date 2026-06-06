import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.me_security_meta_title;
const description = zh.me_security_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/me/security",
    languages: {
      "zh-CN": "/me/security",
      en: "/me/security",
      "x-default": "/me/security",
    },
  },
  openGraph: { title, description, type: "website", url: "/me/security" },
  twitter: { card: "summary_large_image", title, description },
};

export default function MeSecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
