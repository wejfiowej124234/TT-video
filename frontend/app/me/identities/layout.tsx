import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.me_identities_meta_title;
const description = zh.me_identities_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/me/identities",
    languages: {
      "zh-CN": "/me/identities",
      en: "/me/identities",
      "x-default": "/me/identities",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/me/identities",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function MeIdentitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
