/**
 * Community content profile gate (no imports from communityShowcase — avoids cycles).
 */

const LEGACY_DEMO_MEDIA_HOSTS = [
  "images.unsplash.com",
  "w3schools.com",
  "samplelib.com",
  "filesamples.com",
] as const;

/** Production / staging / testnet — Frontend Showcase & demo density hard-off. */
export function isCommunityContentProductionProfile(): boolean {
  if (typeof process === "undefined") return true;
  if (process.env.NODE_ENV === "production") return true;
  const profile = (process.env.NEXT_PUBLIC_TRAVELTRUST_DEPLOY_PROFILE ?? "").trim().toLowerCase();
  if (profile === "production" || profile === "staging" || profile === "testnet") return true;
  if ((process.env.NEXT_PUBLIC_TRAVELTRUST_PHASE ?? "").trim() === "2") return true;
  return false;
}

export function isLegacyDemoCommunityMediaUrl(url: string | undefined | null): boolean {
  if (!url?.trim()) return false;
  const lower = url.trim().toLowerCase();
  return LEGACY_DEMO_MEDIA_HOSTS.some((h) => lower.includes(h));
}

export function allowCommunityShowcaseLayers(): boolean {
  return !isCommunityContentProductionProfile();
}
