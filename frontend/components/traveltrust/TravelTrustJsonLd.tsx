import zh from "@/locales/zh";

const SITE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL?.trim()
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    : "https://traveltrust.app");

/** 页面内结构化数据（TT-PH1-167 · ①）— Server Component，与 layout metadata 同源 */
export function TravelTrustJsonLd() {
  const pageUrl = `${SITE_URL}/traveltrust`;

  const payload = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: zh.traveltrust_meta_title,
    description: zh.traveltrust_meta_description,
    url: pageUrl,
    inLanguage: "zh-CN",
    isPartOf: {
      "@type": "WebSite",
      name: "TravelTrust",
      url: SITE_URL,
    },
    about: {
      "@type": "Organization",
      name: "TravelTrust",
      description: zh.traveltrust_intro,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
      data-tt-traveltrust-jsonld="1"
    />
  );
}
