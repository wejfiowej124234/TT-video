import { joinActiveSpineSlotLabels, type MeIdentitySlotId } from "@/lib/meIdentitySlots";

export function headerUserMenuButtonA11yLabel(
  mePayload: unknown | null,
  locale: string,
  t: (key: string, vars?: Record<string, string>) => string
): string {
  if (!mePayload) return t("header_userMenu");
  const sep = locale === "zh" ? "、" : ", ";
  const slots = joinActiveSpineSlotLabels(mePayload, (id: MeIdentitySlotId) => t(`header_identitySpine_${id}`), sep);
  if (!slots) return t("header_userMenu");
  return t("header_userMenu_spine", { menu: t("header_userMenu"), slots });
}
