import type { CityTransportType } from "./types";

/** 每辆车建议载客上限（包车估算） */
export const CITY_TRANSPORT_SEAT_CAPACITY: Record<CityTransportType, number> = {
  sedan: 4,
  suv: 5,
  van: 8,
};

export function vehiclesNeededForHeadcount(headcount: number, vehicle: CityTransportType): number {
  const cap = CITY_TRANSPORT_SEAT_CAPACITY[vehicle];
  const n = Math.max(1, Math.floor(headcount) || 1);
  return Math.max(1, Math.ceil(n / cap));
}

export function cityTransportFeeForSegment(
  headcount: number,
  vehicle: CityTransportType,
  pricePerVehiclePerDay: number,
  dayCount: number
): number {
  return vehiclesNeededForHeadcount(headcount, vehicle) * pricePerVehiclePerDay * dayCount;
}

/** 人数超出当前车型载客上限时返回 i18n key */
export function cityTransportCapacityWarningKey(
  headcount: number,
  vehicle: CityTransportType | undefined
): string | null {
  if (!vehicle) return null;
  const cap = CITY_TRANSPORT_SEAT_CAPACITY[vehicle];
  if (headcount <= cap) return null;
  if (vehicle === "sedan") return "market_sedanCapacityHint";
  if (vehicle === "suv") return "market_suvCapacityHint";
  return "market_vanCapacityHint";
}
