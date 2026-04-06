import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.auth_verify_email_meta_title;
const description = zh.auth_verify_email_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/auth/verify-email",
    languages: {
      "zh-CN": "/auth/verify-email",
      en: "/auth/verify-email",
      "x-default": "/auth/verify-email",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/auth/verify-email",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function AuthVerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
