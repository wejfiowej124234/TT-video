/**
 * 按城市维度的景区、美食、酒店选项，供自由市场「自定义行程」按天选城市后勾选。
 * 与 geoOptions 的 CITIES_BY_COUNTRY 城市名一致（如 北京、杭州）。
 */
export type Option = { value: string; label: string };

/** 景区带图片与介绍，用于选中后展示 */
export type AttractionDetail = Option & { image: string; description: string };

/** 美食带图片与介绍，用于点选后展示（与景区交互一致） */
export type FoodDetail = Option & { image: string; description: string };

/** 酒店/饭店带图片与介绍，用于点选后展示 */
export type HotelDetail = Option & { image: string; description: string };
