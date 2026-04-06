import type { Metadata } from "next";
import zh from "@/locales/zh";
import TravelTrustAmbientCanvas from "@/components/traveltrust/TravelTrustAmbientCanvas";

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

export default function TravelTrustNetworkLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /** 85：Tropical jade 深色底 + 略暖氛围（仅本路由）+ 点阵 + 全页环境粒子（Canvas）+ 正文层 */
  return (
    <div className="min-h-screen bg-[#14100d] text-slate-100 antialiased relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 bg-traveltrust-atmosphere" aria-hidden />
      <div className="pointer-events-none fixed inset-0 z-0 bg-traveltrust-dot-grid opacity-[0.22]" aria-hidden />
      <TravelTrustAmbientCanvas />
      {/* isolate + 更高 z：正文始终在环境 Canvas（z-[1]）之上，避免叠层异常时整块「看不见」 */}
      <div className="relative z-20 isolate">{children}</div>
    </div>
  );
}
