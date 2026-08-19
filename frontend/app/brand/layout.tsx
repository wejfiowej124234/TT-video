import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.listing_brand_meta_title;
const description = zh.listing_brand_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/brand",
    languages: { "zh-CN": "/brand", en: "/brand", "x-default": "/brand" },
  },
  openGraph: { title, description, type: "website", url: "/brand" },
};

export default function BrandMarkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
