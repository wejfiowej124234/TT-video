import type { Metadata } from "next";
import zh from "@/locales/zh";

/** `/network` 为 `/traveltrust` 永久别名（04 §3.4、85）；canonical/OG 指向真 URL，避免 `/network` 重复内容信号。 */
const title = zh.traveltrust_meta_title;
const description = zh.traveltrust_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/traveltrust",
    languages: {
      "zh-CN": "/traveltrust",
      en: "/traveltrust",
      "x-default": "/traveltrust",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/traveltrust",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function NetworkAliasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
