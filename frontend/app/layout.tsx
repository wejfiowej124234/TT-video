import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Header from "@/components/Header";
import ClientSkipLink from "@/components/ClientSkipLink";
import { VIEWPORT_THEME_LIGHT, VIEWPORT_THEME_DARK } from "@/lib/viewportTheme";
import { getSiteMetadataBase } from "@/lib/siteMetadataBase";
import zh from "@/locales/zh";

const title = zh.meta_title;
const description = zh.meta_description;

export const metadata: Metadata = {
  metadataBase: getSiteMetadataBase(),
  alternates: {
    canonical: "/",
    languages: {
      "zh-CN": "/",
      en: "/",
      "x-default": "/",
    },
  },
  title,
  description,
  icons: { icon: "/favicon.svg" },
  openGraph: { title, description, type: "website", url: "/" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: light)", color: VIEWPORT_THEME_LIGHT }, { media: "(prefers-color-scheme: dark)", color: VIEWPORT_THEME_DARK }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-bg-main text-ink-900 antialiased" suppressHydrationWarning>
        <Providers>
          <ClientSkipLink />
          <Header />
          {/* z-0 确保主内容层始终低于 Header(z-[300])，避免各页全屏背景盖住顶栏导致导航点击无反应 */}
          <div id="main-content" className="relative z-0">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
