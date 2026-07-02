/**
 * 自由市场列表媒体回退：API 无封面时按目的地提供行业标准的示意图（Unsplash · 与 mock 同源）。
 * 仅 UI 展示层；不写入 discover API 响应。
 */

import type { GuideCardItem, OrderCardItem } from "@/lib/marketTypes";
import { AVATARS, TRAVEL_IMAGES_POOL } from "@/lib/communityMockData/constants";
import { guideCardAvatarUrl } from "@/lib/marketMockData/helpers";

const COVER_W = 640;

function unsplash(id: string): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${COVER_W}&q=82`;
}

/** 24+ 唯一肖像 · 按 guide.id 分池，降低占位碰撞 */
const GUIDE_PORTRAIT_POOL: readonly string[] = [
  ...AVATARS.map((u) => u.replace("w=120", `w=${COVER_W}`).replace("q=80", "q=82")),
  unsplash("photo-1519345182560-3f2917c472ef"),
  unsplash("photo-1544005313-94ddf0286df2"),
  unsplash("photo-1438761681033-6461ffad8d80"),
  unsplash("photo-1506794778202-cad84cf45f1d"),
  unsplash("photo-1552374196-c4e7ff6e292a"),
  unsplash("photo-1547425260-76bcadfb4f2c"),
  unsplash("photo-1524504388940-b1c1722653e1"),
  unsplash("photo-1487412720507-e7ab37603c6f"),
  unsplash("photo-1580489944761-15a19d654956"),
  unsplash("photo-1607746882042-94463dfeaf51"),
  unsplash("photo-1614283233556-f35d0a816c6a"),
  unsplash("photo-1624561172888-ac93c6966454"),
  unsplash("photo-1633332755192-727a05c4013b"),
  unsplash("photo-1649970604341-9424162c72ea"),
  unsplash("photo-1655077046704-b67a7a8b7a2b"),
];

/** 城市 / 目的地关键词 → 封面池（同城市多卡按 `id` 稳定分图，避免列表三张完全相同） */
const CITY_ORDER_COVER_LISTS: Record<string, readonly string[]> = {
  北京: [
    unsplash("photo-1508804185872-d7badad00f7d"),
    unsplash("photo-1545569341-9eb8b30979d9"),
    unsplash("photo-1526481280693-3bfa7568e0f3"),
  ],
  beijing: [
    unsplash("photo-1508804185872-d7badad00f7d"),
    unsplash("photo-1545569341-9eb8b30979d9"),
    unsplash("photo-1526481280693-3bfa7568e0f3"),
  ],
  上海: [unsplash("photo-1547970814-9c2b36b2a8e2"), unsplash("photo-1488646953014-85cb44e25828")],
  shanghai: [unsplash("photo-1547970814-9c2b36b2a8e2"), unsplash("photo-1488646953014-85cb44e25828")],
  杭州: [unsplash("photo-1558618666-fcd25c85cd64"), unsplash("photo-1476514525535-07fb3b4ae5f1")],
  hangzhou: [unsplash("photo-1558618666-fcd25c85cd64"), unsplash("photo-1476514525535-07fb3b4ae5f1")],
  成都: [unsplash("photo-1582510003544-4d00b7f74220"), unsplash("photo-1493976040374-85c8e12f0c0e")],
  chengdu: [unsplash("photo-1582510003544-4d00b7f74220"), unsplash("photo-1493976040374-85c8e12f0c0e")],
  西安: [unsplash("photo-1590856029826-c7a73142bbf1"), unsplash("photo-1506905925346-21bda4d32df4")],
  xian: [unsplash("photo-1590856029826-c7a73142bbf1"), unsplash("photo-1506905925346-21bda4d32df4")],
  厦门: [unsplash("photo-1565967511849-76a60a516170"), unsplash("photo-1469854523086-cc02fe5d8800")],
  xiamen: [unsplash("photo-1565967511849-76a60a516170"), unsplash("photo-1469854523086-cc02fe5d8800")],
  大理: [unsplash("photo-1547981609-4b6bfe67ca0b"), unsplash("photo-1506905925346-21bda4d32df4")],
  dali: [unsplash("photo-1547981609-4b6bfe67ca0b"), unsplash("photo-1506905925346-21bda4d32df4")],
  丽江: [unsplash("photo-1547981609-4b6bfe67ca0b"), unsplash("photo-1528360983277-13d401cdc186")],
  青岛: [unsplash("photo-1609137144813-7d9921338f24"), unsplash("photo-1476514525535-07fb3b4ae5f1")],
  qingdao: [unsplash("photo-1609137144813-7d9921338f24"), unsplash("photo-1476514525535-07fb3b4ae5f1")],
  东京: [unsplash("photo-1540959733332-eab4deabeeaf"), unsplash("photo-1528360983277-13d401cdc186")],
  tokyo: [unsplash("photo-1540959733332-eab4deabeeaf"), unsplash("photo-1528360983277-13d401cdc186")],
  大阪: [unsplash("photo-1590559899732-a81843c2c4d4"), unsplash("photo-1540959733332-eab4deabeeaf")],
  首尔: [unsplash("photo-1517154421773-4d38c83d0fbf"), unsplash("photo-1526481280693-3bfa7568e0f3")],
  seoul: [unsplash("photo-1517154421773-4d38c83d0fbf"), unsplash("photo-1526481280693-3bfa7568e0f3")],
};

const COVER_GRADIENTS = [
  "from-ref-sun/28 via-ink-900/92 to-[#0a0a0a]",
  "from-ref-coral/22 via-ink-900/94 to-[#0c0a09]",
  "from-amber-900/35 via-ink-900/90 to-[#0a0a0a]",
  "from-teal-900/30 via-ink-900/92 to-[#0a0a0a]",
] as const;

function normalizeLocationToken(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

function lookupCityCoverList(...candidates: (string | null | undefined)[]): readonly string[] | null {
  for (const raw of candidates) {
    const t = (raw ?? "").trim();
    if (!t) continue;
    const hit = CITY_ORDER_COVER_LISTS[t] ?? CITY_ORDER_COVER_LISTS[normalizeLocationToken(t)];
    if (hit) return hit;
    const first = t.split(/[·,，/\s]+/)[0]?.trim();
    if (first) {
      const hit2 = CITY_ORDER_COVER_LISTS[first] ?? CITY_ORDER_COVER_LISTS[normalizeLocationToken(first)];
      if (hit2) return hit2;
    }
  }
  return null;
}

function stablePoolIndex(seed: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return modulo > 0 ? h % modulo : 0;
}

function nonEmptyUrl(url: string | null | undefined): string | null {
  const u = (url ?? "").trim();
  return u.length > 0 ? u : null;
}

/** 订单封面：真实 `image` 优先，否则目的地示意（始终尽量返回可加载 URL） */
export function resolveMarketOrderCoverUrl(item: Pick<OrderCardItem, "id" | "image" | "city" | "destination" | "country">): string {
  const explicit = nonEmptyUrl(item.image);
  if (explicit) return explicit;
  const cityList = lookupCityCoverList(item.city, item.destination, item.country);
  if (cityList?.length) {
    return cityList[stablePoolIndex(item.id || item.destination || item.city || "order", cityList.length)];
  }
  const seed = item.id || item.destination || item.city || "order";
  return TRAVEL_IMAGES_POOL[stablePoolIndex(seed, TRAVEL_IMAGES_POOL.length)] ?? TRAVEL_IMAGES_POOL[0];
}

/** 无图时的渐变 class（按 id 稳定） */
export function marketCoverGradientClass(seed: string): string {
  return COVER_GRADIENTS[stablePoolIndex(seed, COVER_GRADIENTS.length)];
}

/** 向导头像：API 头像优先；占位图按 guide.id 在扩展肖像池分池 */
export function resolveGuideAvatarUrl(guide: Pick<GuideCardItem, "id" | "avatar_url" | "city" | "user_id">): string {
  const explicit = nonEmptyUrl(guide.avatar_url);
  if (explicit) {
    return explicit.replace("w=120", `w=${COVER_W}`).replace("q=80", "q=82");
  }
  const idx = stablePoolIndex(guide.id || guide.user_id || guide.city || "guide", GUIDE_PORTRAIT_POOL.length);
  return GUIDE_PORTRAIT_POOL[idx] ?? guideCardAvatarUrl(idx % 8);
}

/** 抽屉/详情标题：避免 country · city · destination 重复（如「中国 · 北京 · 中国」） */
export function formatMarketOrderDestination(
  item: Pick<OrderCardItem, "country" | "city" | "destination">,
  dash: string,
): string {
  const destination = item.destination?.trim();
  const city = item.city?.trim();
  const country = item.country?.trim();
  if (destination) {
    const prefix = [country, city].filter((part) => part && !destination.includes(part));
    return prefix.length > 0 ? `${prefix.join(" · ")} · ${destination}` : destination;
  }
  const joined = [country, city].filter(Boolean).join(" · ");
  return joined || dash;
}

/** 卡片摘要一行（highlights / 行程首日 content_text 或 description） */
export function marketOrderCardTeaser(item: OrderCardItem): string | null {
  const h = item.highlights?.find((x) => typeof x === "string" && x.trim());
  if (h) return h.trim();
  const day1 = item.itinerary?.daily_itinerary?.find((d) => {
    const text = (d.description ?? d.content_text ?? "").trim();
    return text.length > 0;
  });
  if (day1) {
    return (day1.description ?? day1.content_text ?? "").trim();
  }
  return null;
}
