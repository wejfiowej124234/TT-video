import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.listing_assurance_meta_title;
const description = zh.listing_assurance_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/assurance",
    languages: { "zh-CN": "/assurance", en: "/assurance", "x-default": "/assurance" },
  },
  openGraph: { title, description, type: "website", url: "/assurance" },
};

export default function AssuranceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
