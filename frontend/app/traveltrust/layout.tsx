import type { Metadata } from "next";
import zh from "@/locales/zh";
import TravelTrustAmbientCanvas from "@/components/traveltrust/TravelTrustAmbientCanvas";
import { TravelTrustJsonLd } from "@/components/traveltrust/TravelTrustJsonLd";
import { TravelTrustRouteFixedAmbientLayers } from "@/components/traveltrust/TravelTrustRouteFixedAmbientLayers";
import { UNIFIED_PAGE_3D } from "@/components/traveltrust/cinematic/traveltrustPageCinematicConfig";
import {
  TRAVELTRUST_GLOBE_CLOUD_TEXTURE_PATH,
  TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH,
} from "@/lib/traveltrustGlobeEarthAsset";
import { uniqueRoleVideoPrefetchEntries } from "@/lib/traveltrustMediaFromBrief";
import { loadTraveltrustLayoutPreload } from "@/lib/traveltrustPageBrief.server";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

const siteUrl =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL?.trim()) ||
  "https://traveltrust.app";

const title = zh.traveltrust_meta_title;
const description = zh.traveltrust_meta_description;
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: ["TravelTrust", "travel", "Web3", "escrow", "custom trip", "定制游", "托管"],
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/traveltrust",
    languages: {
      "zh-CN": "/traveltrust",
      en: "/traveltrust",
      "x-default": "/traveltrust",
    },
  },
  applicationName: "TravelTrust",
  category: "travel",
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

export default async function TravelTrustNetworkLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const preload = await loadTraveltrustLayoutPreload();

  return (
    <div className="min-h-screen bg-[#0c0a09] text-slate-100 antialiased relative overflow-x-clip [color-scheme:dark]">
      {/* 压住根 layout body.bg-bg-main（暗色 #0b1220）在顶栏/Canvas 透明缝露青 */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[#0c0a09]" aria-hidden data-tt-traveltrust-page-ink-base="1" />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{function p(){var h=(location.hash||"").replace(/^#/,"");if(h&&h!=="hero")return;var y=Math.max(window.scrollY||0,document.documentElement.scrollTop||0,document.body.scrollTop||0);if(y>48)return;history.scrollRestoration="manual";scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;}p();[0,80,250,600,1200,2200,3400].forEach(function(ms){setTimeout(p,ms);});window.addEventListener("pageshow",p);}catch(e){}})();`,
        }}
      />
      <link rel="preload" href={preload.hero.poster} as="image" fetchPriority="high" />
      <link
        rel="preload"
        href={TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH}
        as="image"
        fetchPriority="high"
        crossOrigin="anonymous"
      />
      <link rel="preload" href={TRAVELTRUST_GLOBE_CLOUD_TEXTURE_PATH} as="image" crossOrigin="anonymous" />
      {preload.hero.mp4 && !UNIFIED_PAGE_3D ? (
        <link rel="preload" href={preload.hero.mp4} as="fetch" crossOrigin="anonymous" />
      ) : null}
      {uniqueRoleVideoPrefetchEntries(preload.roles).map((role) => (
        <link key={role.roleId} rel="prefetch" href={role.mp4} />
      ))}
      <TravelTrustJsonLd />
      <TravelTrustRouteFixedAmbientLayers subdued={UNIFIED_PAGE_3D} />
      {!UNIFIED_PAGE_3D ? <TravelTrustAmbientCanvas /> : null}
      <div
        className={`relative ${ttZClass(TT_Z.CONTENT)} isolate`}
        data-tt-traveltrust-layout-preload-source={preload.source}
        data-tt-traveltrust-layout-preload-tier={preload.hero.tier}
      >
        {children}
      </div>
    </div>
  );
}
