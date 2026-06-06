import type { Metadata } from "next";
import zh from "@/locales/zh";
import { AdminCapabilitiesShell } from "@/components/admin/AdminCapabilitiesShell";
import { assertAdminConsoleServerGate } from "@/lib/admin/adminLayoutServerGate";

/** 70：Admin 子树统一壳；metadata 惯例取 zh（与 governance 同构）。页身仍由客户端 i18n。 */
const title = zh.admin_meta_title;
const description = zh.admin_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/admin",
    languages: {
      "zh-CN": "/admin",
      en: "/admin",
      "x-default": "/admin",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/admin",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await assertAdminConsoleServerGate();
  return <AdminCapabilitiesShell>{children}</AdminCapabilitiesShell>;
}
