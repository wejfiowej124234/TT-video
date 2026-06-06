import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.providerRegister_meta_title;
const description = zh.providerRegister_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/provider/register",
    languages: {
      "zh-CN": "/provider/register",
      en: "/provider/register",
      "x-default": "/provider/register",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/provider/register",
  },
};

export default function ProviderRegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
