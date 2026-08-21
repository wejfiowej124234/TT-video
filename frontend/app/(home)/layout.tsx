import type { Metadata } from "next";
import en from "@/locales/en";
import TravelTrustAmbientCanvas from "@/components/traveltrust/TravelTrustAmbientCanvas";
import { TravelTrustJsonLd } from "@/components/traveltrust/TravelTrustJsonLd";
import { TravelTrustLayoutDeferredPreload } from "@/components/traveltrust/TravelTrustLayoutDeferredPreload";
import { TravelTrustRouteFixedAmbientLayers } from "@/components/traveltrust/TravelTrustRouteFixedAmbientLayers";
import { UNIFIED_PAGE_3D } from "@/components/traveltrust/cinematic/traveltrustPageCinematicConfig";
import {
  TRAVELTRUST_GLOBE_CLOUD_TEXTURE_PATH,
  TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH,
} from "@/lib/traveltrustGlobeEarthAsset";
import { getTraveltrustLayoutPreloadSync } from "@/lib/traveltrustPageBrief.server";
import { getSiteMetadataBase } from "@/lib/siteMetadataBase";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";
import { TravelTrustHomePrefetchBoot } from "@/modules/traveltrust-home";

const title = en.traveltrust_meta_title;
const description = en.traveltrust_meta_description;
export const metadata: Metadata = {
  metadataBase: getSiteMetadataBase(),
  title,
  description,
  keywords: ["TravelTrust", "travel", "Web3", "escrow", "custom trip"],
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
    languages: {
      "zh-CN": "/",
      en: "/",
      "x-default": "/",
    },
  },
  applicationName: "TravelTrust",
  category: "travel",
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function OfficialHomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const preload = getTraveltrustLayoutPreloadSync();

  return (
    <div className="min-h-screen bg-[#0c0a09] text-slate-100 antialiased relative overflow-x-clip [color-scheme:dark]">
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
      <TravelTrustJsonLd />
      <TravelTrustHomePrefetchBoot />
      <TravelTrustLayoutDeferredPreload />
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
