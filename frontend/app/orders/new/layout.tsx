import type { Metadata } from "next";
import zh from "@/locales/zh";

/** 子路由覆父级 `/orders` canonical。metadata 惯例取 zh；页身仍由客户端 i18n。 */
const title = zh.orders_new_meta_title;
const description = zh.orders_new_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/orders/new",
    languages: {
      "zh-CN": "/orders/new",
      en: "/orders/new",
      "x-default": "/orders/new",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/orders/new",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function OrdersNewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
