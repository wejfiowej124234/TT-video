import type { Metadata } from "next";
import zh from "@/locales/zh";
import { EscrowDetailSection } from "@/components/escrow/EscrowDetailSection";
import { TT_ESCROW_PROTOCOL_PAGE_SHELL } from "@/lib/escrowProtocolUi";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const path = `/escrow/${id}`;
  const title = zh.escrow_meta_title;
  const description = zh.escrow_meta_description;
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        "zh-CN": path,
        en: path,
        "x-default": path,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Next 15：`dynamic(..., { ssr: false })` 须在 Client 组件内；见 `components/escrow/EscrowDetailSection` */
export default async function EscrowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className={TT_ESCROW_PROTOCOL_PAGE_SHELL}>
      <div className="container py-8 md:py-12 max-w-5xl">
        <EscrowDetailSection escrowId={id} />
      </div>
    </div>
  );
}
