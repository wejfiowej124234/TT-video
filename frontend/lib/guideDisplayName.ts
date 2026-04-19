/**
 * B-471：向导展示名单一真值（`GuideCard`、`BookGuideModal` 副标题、`/guides/[id]` 大标题）。
 * 与历史 `GuideCard` 一致：`guide_card_cityGuide` / `guide_card_guide`。
 */
export function formatGuideDisplayName(
  t: (key: string) => string,
  guide: { city?: string | null },
): string {
  const city = typeof guide.city === "string" ? guide.city.trim() : "";
  if (city) return t("guide_card_cityGuide").replace("{{city}}", city);
  return t("guide_card_guide");
}
