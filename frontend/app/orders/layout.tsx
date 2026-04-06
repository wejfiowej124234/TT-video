import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.orders_meta_title;
const description = zh.orders_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/orders",
    languages: {
      "zh-CN": "/orders",
      en: "/orders",
      "x-default": "/orders",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/orders",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function OrdersLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
