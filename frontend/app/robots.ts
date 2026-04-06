import type { MetadataRoute } from "next";

import { getSiteMetadataBase } from "@/lib/siteMetadataBase";

/** 爬虫级口径：运维子树不抓取（与 `admin/layout.tsx` `metadata.robots`、13-1 不对外导航一致）；`sitemap` 与 `app/sitemap.ts` 闭环。 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteMetadataBase();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
