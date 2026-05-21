/**
 * 产品称谓 SSOT（中文展示 · 与 docs/spec/87 §1.1 / §1.5 / §1.6 一致）
 *
 * **首页剧场五角色**（`TravelTrustRoleId`）：游客 · 向导 · 商家 · 旅行收购 · 区域主理人
 * **API 契约四类**（`users.role` 等）：`traveler` · `guide` · `provider` · `region_steward`
 *   - 剧场 **商家** ↔ API **`provider`**
 *   - 剧场 **向导** 叙事合并原 **接待方**（不再单独 Tab）
 *
 * i18n 真源：`locales/zh.ts` / `en.ts`；本文件供测试与机读对拍。
 */

import type { TravelTrustRoleId } from "@/app/traveltrust/traveltrustIdentityModel";

/** 首页剧场 · 中文产品名 */
export const TT_THEATER_ROLE_ZH: Record<TravelTrustRoleId, string> = {
  traveler: "游客",
  guide: "向导",
  merchant: "商家",
  acquisition: "旅行收购",
  region_steward: "区域主理人",
};

/** 剧场 id 顺序（与 `TRAVELTRUST_ROLES` 一致） */
export const TT_THEATER_ROLE_ORDER: readonly TravelTrustRoleId[] = [
  "traveler",
  "guide",
  "merchant",
  "acquisition",
  "region_steward",
];

/** API / DB 契约角色（87 §1.2） */
export type TravelTrustApiRoleId = "traveler" | "guide" | "provider" | "region_steward";

export const TT_API_ROLE_ZH: Record<TravelTrustApiRoleId, string> = {
  traveler: "游客",
  guide: "向导",
  provider: "商家",
  region_steward: "区域主理人",
};

/** 剧场 id → API 契约字段（无 API 映射的剧场角色见注释） */
export const TT_THEATER_TO_API_ROLE: Partial<Record<TravelTrustRoleId, TravelTrustApiRoleId>> = {
  traveler: "traveler",
  guide: "guide",
  merchant: "provider",
  region_steward: "region_steward",
};

/** 自由市场 Hub Tab（87 §1.5） */
export const TT_MARKET_HUB_TAB_ZH = {
  travel: "旅行预约",
  merchant: "商家",
  acquisition: "旅行收购",
} as const;

/** 已废弃（禁止新 UI / 新剧场 Tab） */
export const TT_DEPRECATED_ROLE_ALIASES_ZH = ["旅行者", "区域管家", "接待方", "商铺"] as const;
