import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isUuidString } from "@/lib/isUuidString";
import { localeMessagesFromAcceptLanguage } from "@/lib/pickMetadataLocale";

/**
 * 消费者「订单详情」canonical 为 `/escrow/:id`；此路由承接 `/orders/:uuid` 深链，避免 404 与断分享。
 * 列表页仍用抽屉；直达链接可统一为托管详情。
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tid = id.trim();
  const path = `/orders/${id}`;
  const h = await headers();
  const loc = localeMessagesFromAcceptLanguage(h.get("accept-language"));
  if (!tid || !isUuidString(tid)) {
    return {
      title: `${loc.notFound_title} | TravelTrust`,
      description: loc.notFound_description,
      alternates: { canonical: path },
    };
  }
  return {
    title: loc.escrow_meta_title,
    description: loc.escrow_meta_description,
    alternates: { canonical: `/escrow/${tid}` },
  };
}

export default async function OrdersByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tid = id.trim();
  if (!tid || !isUuidString(tid)) notFound();
  redirect(`/escrow/${encodeURIComponent(tid)}`);
}
