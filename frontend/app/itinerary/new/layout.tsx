import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.itinerary_new_meta_title;
const description = zh.itinerary_new_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/itinerary/new",
    languages: {
      "zh-CN": "/itinerary/new",
      en: "/itinerary/new",
      "x-default": "/itinerary/new",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/itinerary/new",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function ItineraryNewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
