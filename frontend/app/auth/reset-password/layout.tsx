import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.auth_reset_password_meta_title;
const description = zh.auth_reset_password_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/auth/reset-password",
    languages: {
      "zh-CN": "/auth/reset-password",
      en: "/auth/reset-password",
      "x-default": "/auth/reset-password",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/auth/reset-password",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function AuthResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
