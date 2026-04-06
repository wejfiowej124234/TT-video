import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.auth_login_meta_title;
const description = zh.auth_login_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/auth/login",
    languages: {
      "zh-CN": "/auth/login",
      en: "/auth/login",
      "x-default": "/auth/login",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/auth/login",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function AuthLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
