import { shortEvmAddress } from "@/lib/formatEvmAddress";
import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";
import { ADMIN_OPS_OBSERVABILITY_RELATED_LINK } from "@/lib/admin/adminOpsListRelatedFoldLinks";

export type AdminGuideDetailRes = {
  status?: string;
  error?: string;
  guide?: Record<string, unknown>;
  meta?: unknown;
};

export const ADMIN_GUIDE_CREDENTIAL_URL_KEYS = new Set([
  "id_photo_url",
  "language_cert_url",
  "guide_license_url",
]);

export function adminGuideDetailFmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export type AdminGuideDetailRowDef = { key: string; labelKey: string; display?: string };

export function buildAdminGuideDetailRowDefs(guide: Record<string, unknown>): AdminGuideDetailRowDef[] {
  const walletRaw = typeof guide.wallet_address === "string" ? guide.wallet_address.trim() : "";
  return [
    { key: "id", labelKey: "admin_guides_colGuideId" },
    { key: "user_id", labelKey: "admin_guides_colUserId" },
    { key: "city", labelKey: "admin_guides_colCity" },
    { key: "country_code", labelKey: "admin_guides_colCountry" },
    { key: "status", labelKey: "admin_guides_colStatus" },
    { key: "stake_amount", labelKey: "admin_guides_colStake" },
    {
      key: "wallet_address",
      labelKey: "admin_guides_colWallet",
      display: walletRaw ? shortEvmAddress(walletRaw) : "",
    },
    { key: "real_name", labelKey: "admin_guide_detail_realName" },
    { key: "bio", labelKey: "admin_guide_detail_bio" },
    { key: "languages", labelKey: "admin_guide_detail_languages" },
    { key: "service_types", labelKey: "admin_guide_detail_serviceTypes" },
    { key: "id_photo_url", labelKey: "admin_guide_detail_idPhotoUrl" },
    { key: "language_cert_url", labelKey: "admin_guide_detail_langCertUrl" },
    { key: "guide_license_url", labelKey: "admin_guide_detail_licenseUrl" },
    { key: "created_at", labelKey: "admin_guide_detail_createdAt" },
    { key: "updated_at", labelKey: "admin_guide_detail_updatedAt" },
  ];
}

export const GUIDE_DETAIL_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/guides", labelKey: "admin_guide_detail_back_list", dataTt: "admin-guide-detail-back-list" },
  { href: "/admin/users", labelKey: "admin_users_title" },
  { href: "/admin/reviews", labelKey: "admin_reviews_title" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];
