/**
 * Platform media cover dual-read (B-MEDIA-001 eng · Local SSOT).
 * Prefer `cover_media_asset_id` + playback URL over inline data-URL `cover_image`.
 * Does **not** claim CDN Acceptance PASS.
 */

export type PlatformMediaCoverInput = {
  coverMediaAssetId?: string | null;
  /** Resolved CDN/object playback URL when known */
  assetPlaybackUrl?: string | null;
  /** Legacy cover field (http(s) OK; data: discouraged when asset id present) */
  coverImage?: string | null;
};

/** True when value is an inline data-URL (forbidden as persistence truth). */
export function isInlineDataUrlCover(value: string | null | undefined): boolean {
  return Boolean(value?.trim().toLowerCase().startsWith("data:"));
}

/**
 * Resolve display src for itinerary/merchant/acquisition covers.
 * Order: asset playback URL → non-data coverImage → null (pending hydrate when only asset id).
 */
export function resolvePlatformMediaCoverSrc(input: PlatformMediaCoverInput): string | null {
  const playback = input.assetPlaybackUrl?.trim();
  if (playback) return playback;

  const img = input.coverImage?.trim();
  if (img && !isInlineDataUrlCover(img)) return img;

  if (input.coverMediaAssetId?.trim()) {
    // Asset id present without playback URL yet — do not fall back to data URL.
    return null;
  }

  return img || null;
}
