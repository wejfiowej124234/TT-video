import type { Metadata } from "next";
import zh from "@/locales/zh";

/** `/auth` 段级 metadata（zh 惯例）；子路由各段 `layout`（如 login/register）仍覆 canonical/title。 */
const title = zh.auth_meta_title;
const description = zh.auth_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/auth",
    languages: {
      "zh-CN": "/auth",
      en: "/auth",
      "x-default": "/auth",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/auth",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function AuthSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
