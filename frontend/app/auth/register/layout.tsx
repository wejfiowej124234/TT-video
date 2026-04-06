import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.auth_register_meta_title;
const description = zh.auth_register_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/auth/register",
    languages: {
      "zh-CN": "/auth/register",
      en: "/auth/register",
      "x-default": "/auth/register",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/auth/register",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function AuthRegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
