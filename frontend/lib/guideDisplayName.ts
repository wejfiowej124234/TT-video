/**
 * B-471：向导展示名单一真值（`GuideCard`、`BookGuideModal` 副标题、`/guides/[id]` 大标题）。
 * 优先 `public_title`（挂牌展示名，与 account nickname 分轨）；否则 `{city} 向导`。
 */
import { isInternalMarketSeedCopy } from "@/lib/marketDisplayCopy";

export function formatGuideDisplayName(
  t: (key: string) => string,
  guide: { city?: string | null; public_title?: string | null },
): string {
  const publicTitle = typeof guide.public_title === "string" ? guide.public_title.trim() : "";
  if (publicTitle && !isInternalMarketSeedCopy(publicTitle)) return publicTitle;
  const city = typeof guide.city === "string" ? guide.city.trim() : "";
  if (city) return t("guide_card_cityGuide").replace("{{city}}", city);
  return t("guide_card_guide");
}
