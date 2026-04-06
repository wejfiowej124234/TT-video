import type { Metadata } from "next";
import zh from "@/locales/zh";

/** Phase 4（07 §二）：支付入口；metadata 惯例取 zh，英文 UI 由页面内 i18n 覆盖。 */
const title = zh.pay_meta_title;
const description = zh.pay_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/pay",
    languages: {
      "zh-CN": "/pay",
      en: "/pay",
      "x-default": "/pay",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/pay",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
