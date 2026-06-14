import type {
  MeMerchantListingDraft,
  MeMerchantListingPublished,
} from "@/lib/apiClient/meMerchantListings";

export type MerchantWorkbenchShowcaseRow =
  | {
      kind: "published";
      id: string;
      title: string;
      updatedAt?: string;
      coverUrl?: string | null;
    }
  | {
      kind: "draft";
      id: string;
      title: string;
      savedAt?: string;
      coverUrl?: string | null;
    };

export function merchantListingDisplayTitle(raw: string | undefined, fallbackKey: string): string {
  const trimmed = raw?.trim() ?? "";
  return trimmed !== "" ? trimmed : fallbackKey;
}

export function mapMerchantWorkbenchShowcaseRows(input: {
  published: MeMerchantListingPublished[];
  drafts: MeMerchantListingDraft[];
  untitledKey: string;
}): MerchantWorkbenchShowcaseRow[] {
  const published = input.published.map((row) => ({
    kind: "published" as const,
    id: row.id,
    title: merchantListingDisplayTitle(row.title, input.untitledKey),
    updatedAt: row.updated_at,
    coverUrl: row.cover_url ?? null,
  }));
  const drafts = input.drafts.map((row) => ({
    kind: "draft" as const,
    id: row.id,
    title: merchantListingDisplayTitle(row.title, input.untitledKey),
    savedAt: row.saved_at,
    coverUrl: row.cover_url ?? null,
  }));
  return [...published, ...drafts];
}

export function shouldShowMerchantWorkbenchShowcaseInventory(rows: MerchantWorkbenchShowcaseRow[]): boolean {
  return rows.length > 0;
}
