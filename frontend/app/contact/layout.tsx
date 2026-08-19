import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.listing_contact_meta_title;
const description = zh.listing_contact_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/contact",
    languages: { "zh-CN": "/contact", en: "/contact", "x-default": "/contact" },
  },
  openGraph: { title, description, type: "website", url: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
