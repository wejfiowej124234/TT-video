import type { Metadata } from "next";
import zh from "@/locales/zh";

/** 子路由覆父级 `/me` canonical。metadata 惯例取 zh；页身仍由客户端 i18n。 */
const title = zh.me_password_meta_title;
const description = zh.me_password_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/me/password",
    languages: {
      "zh-CN": "/me/password",
      en: "/me/password",
      "x-default": "/me/password",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/me/password",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function MePasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
