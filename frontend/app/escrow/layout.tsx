import type { Metadata } from "next";
import zh from "@/locales/zh";

/** 段级默认 metadata（zh）；子路由 `escrow/[id]`、`rate` 以 `generateMetadata` 覆写 canonical/url。不设 `/escrow` canonical / `openGraph.url`，避免无列表页时误导（07 §六 6.4 · 661/662 口径）。 */
const title = zh.escrow_meta_title;
const description = zh.escrow_meta_description;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function EscrowLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
