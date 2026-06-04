import type { AdminHomeCard, AdminHomeCardTier } from "./adminHomeModel";
import { isSuperAdminActorRole } from "./adminActorFromMe";

export type { AdminHomeCardTier };

export function adminHomeCardVisibleForRole(card: AdminHomeCard, role: string | null): boolean {
  if (!card.superAdminOnly) return true;
  return isSuperAdminActorRole(role);
}

export function filterAdminHomeCardsForRole(
  cards: AdminHomeCard[] = [],
  role: string | null,
): AdminHomeCard[] {
  if (!Array.isArray(cards)) return [];
  return cards.filter((c) => adminHomeCardVisibleForRole(c, role));
}

export function adminHomeTierLabelKey(tier: AdminHomeCardTier): string {
  switch (tier) {
    case "write":
      return "admin_home_card_tier_write";
    case "super_write":
      return "admin_home_card_tier_super_write";
    case "placeholder":
      return "admin_home_card_tier_placeholder";
    default:
      return "admin_home_card_tier_read";
  }
}
