/**
 * 按国家独立定价：各国房价、用车、城际交通、景区/餐饮单价、向导等级价不同。
 * 与 geoOptions 国家名一致（中国、日本、泰国等），供 CustomItineraryModal 报价使用。
 */

export type CityTransportType = "sedan" | "suv" | "van";
export type TransportType = "flight" | "rail";
export type GuideLevel = "primary" | "intermediate" | "advanced" | "expert";

export interface CountryPricingConfig {
  /** 市内用车：轿车/SUV/商务 每日单价（元或当地币） */
  cityTransportPrice: Record<CityTransportType, number>;
  /** 城际交通：飞机/高铁 每人单价 */
  intercityPricePerPerson: { flight: number; rail: number };
  /** 景区单价（每人每处） */
  perAttraction: number;
  /** 餐饮单价（每人每处） */
  perFood: number;
  /** 住宿：每间夜每人 */
  hotelPerNightPerPerson: number;
  /** 向导等级建议日薪（初级/中级/高级/专家） */
  guideLevelsSuggestedPerDay: Record<GuideLevel, number>;
}
