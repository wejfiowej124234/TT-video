import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.auth_forgot_password_meta_title;
const description = zh.auth_forgot_password_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/auth/forgot-password",
    languages: {
      "zh-CN": "/auth/forgot-password",
      en: "/auth/forgot-password",
      "x-default": "/auth/forgot-password",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/auth/forgot-password",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function AuthForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
