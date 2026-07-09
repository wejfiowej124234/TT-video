/**
 * Public chrome hygiene — seed/test personas must not leak on consumer surfaces unless
 * `NEXT_PUBLIC_TRAVELTRUST_ALLOW_TEST_PERSONA_CHROME=1` (local engineering only).
 *
 * Mirrors backend `is_dev_catalog_email` / community nickname heuristics (read-only).
 */

const SEED_TEST_EMAILS = new Set(
  [
    "tourist@test.com",
    "guide@test.com",
    "multi-demo@test.com",
    "merchant@test.com",
    "provider-did-rank-demo@test.com",
    "steward-did-rank-demo@test.com",
    "tg_guide_main@trustgate-e2e.local",
  ].map((e) => e.toLowerCase()),
);

const TEST_NICKNAME_MARKERS = [
  "测试游客",
  "E2E Narrow",
  "SuperAdmin",
  "TG E2E",
  "cms-uat",
] as const;

export function allowPublicTestPersonaChrome(): boolean {
  return process.env.NEXT_PUBLIC_TRAVELTRUST_ALLOW_TEST_PERSONA_CHROME === "1";
}

export function isDevCatalogEmail(email: string | null | undefined): boolean {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return false;
  if (e.endsWith("@traveltrust.test")) return true;
  if (e.endsWith("@test.com")) return true;
  if (e.endsWith("@trustgate-e2e.local")) return true;
  return SEED_TEST_EMAILS.has(e);
}

export function isPublicTestPersonaNickname(nickname: string | null | undefined): boolean {
  const n = (nickname ?? "").trim();
  if (!n) return false;
  if (TEST_NICKNAME_MARKERS.some((m) => n.includes(m))) return true;
  if (/演示/.test(n)) return true;
  if (/\bdemo\b/i.test(n)) return true;
  if (/\be2e\b/i.test(n)) return true;
  if (/^smoke[-_]/i.test(n)) return true;
  if (n.includes("联调")) return true;
  return false;
}

export function isPublicTestPersonaSignal(
  nickname: string | null | undefined,
  email: string | null | undefined,
): boolean {
  return isDevCatalogEmail(email) || isPublicTestPersonaNickname(nickname);
}

export function emailFromMePayload(me: unknown): string | null {
  if (!me || typeof me !== "object") return null;
  const root = me as Record<string, unknown>;
  const inner =
    root.user && typeof root.user === "object" && root.user !== null
      ? (root.user as Record<string, unknown>)
      : root;
  const email = inner.email;
  return typeof email === "string" && email.trim() ? email.trim() : null;
}

/** Sanitized nickname for header chrome / public menus. */
export function publicChromeDisplayName(
  nickname: string | null | undefined,
  email: string | null | undefined,
  fallbackLabel: string,
): string {
  if (allowPublicTestPersonaChrome()) {
    const n = nickname?.trim();
    return n && n.length > 0 ? n : fallbackLabel;
  }
  if (isPublicTestPersonaSignal(nickname, email)) {
    return fallbackLabel;
  }
  const n = nickname?.trim();
  return n && n.length > 0 ? n : fallbackLabel;
}
