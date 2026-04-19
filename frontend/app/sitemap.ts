import type { MetadataRoute } from "next";

import { hreflangSitemapLanguages } from "@/lib/hreflangSitemapLanguages";
import { getSiteMetadataBase } from "@/lib/siteMetadataBase";

/** 静态公开索引路径（与 13-1 表 1 主入口一致；不含 `/admin`、动态 id 页）。 */
const ENTRIES: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[0]["changeFrequency"]>;
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/market", changeFrequency: "daily", priority: 0.95 },
  { path: "/market/provider", changeFrequency: "weekly", priority: 0.75 },
  { path: "/market/acquisition", changeFrequency: "weekly", priority: 0.75 },
  { path: "/traveltrust", changeFrequency: "weekly", priority: 0.9 },
  { path: "/did-rank", changeFrequency: "daily", priority: 0.85 },
  { path: "/community", changeFrequency: "daily", priority: 0.85 },
  { path: "/help", changeFrequency: "monthly", priority: 0.7 },
  { path: "/governance", changeFrequency: "weekly", priority: 0.75 },
  { path: "/trust", changeFrequency: "weekly", priority: 0.72 },
  { path: "/guides", changeFrequency: "daily", priority: 0.8 },
  { path: "/staking", changeFrequency: "weekly", priority: 0.65 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms/community-guidelines", changeFrequency: "yearly", priority: 0.35 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteMetadataBase();
  const lastModified = new Date();
  return ENTRIES.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, base).toString(),
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: hreflangSitemapLanguages(base, path),
    },
  }));
}
