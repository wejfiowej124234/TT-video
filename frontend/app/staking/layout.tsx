import type { Metadata } from "next";
import zh from "@/locales/zh";

/** Phase 4（07 §二）：向导质押入口；与 01 Registry 方案 B、05/06 一致。 */
const title = zh.staking_meta_title;
const description = zh.staking_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/staking",
    languages: {
      "zh-CN": "/staking",
      en: "/staking",
      "x-default": "/staking",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/staking",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function StakingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
