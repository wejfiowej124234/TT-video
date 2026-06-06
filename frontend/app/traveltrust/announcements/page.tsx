import type { Metadata } from "next";
import zh from "@/locales/zh";
import { TravelTrustAnnouncementsPage } from "@/components/traveltrust/cinematic/TravelTrustAnnouncementsPage";

export const metadata: Metadata = {
  title: zh.traveltrust_announcements_title,
  description: zh.traveltrust_announcements_meta_desc,
  alternates: { canonical: "/traveltrust/announcements" },
};

export default function TravelTrustAnnouncementsRoutePage() {
  return <TravelTrustAnnouncementsPage />;
}
