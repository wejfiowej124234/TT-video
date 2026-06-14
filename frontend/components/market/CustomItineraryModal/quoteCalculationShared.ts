import type { CountryPricingConfig } from "@/lib/countries";
import type { CityTransportType, TransportType } from "./types";
import type { InterCityLine, TransportLine } from "./quoteCalculationTypes";
import {
  cityTransportFeeForSegment,
  vehiclesNeededForHeadcount,
} from "./cityTransportQuote";

interface DayWithCityTransport {
  city?: string;
  cityTransport?: CityTransportType;
  transport?: TransportType;
}

export function buildCityTransportLines<T extends DayWithCityTransport>(
  plans: T[],
  headcount: number,
  pricing: CountryPricingConfig
): { lines: TransportLine[]; totalFee: number } {
  const lines: TransportLine[] = [];
  let totalFee = 0;
  let i = 0;
  while (i < plans.length) {
    const t = plans[i].cityTransport;
    if (!t) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < plans.length && plans[j + 1].cityTransport === t) j++;
    const dayCount = j - i + 1;
    const unitPrice = pricing.cityTransportPrice[t] ?? 0;
    const vehicleCount = vehiclesNeededForHeadcount(headcount, t);
    const fee = cityTransportFeeForSegment(headcount, t, unitPrice, dayCount);
    lines.push({ dayFrom: i + 1, dayTo: j + 1, vehicle: t, fee, vehicleCount });
    totalFee += fee;
    i = j + 1;
  }
  return { lines, totalFee };
}

export function buildInterCityLines<T extends DayWithCityTransport>(
  plans: T[],
  headcount: number,
  pricing: CountryPricingConfig
): { lines: InterCityLine[]; totalFee: number; hasInterCity: boolean } {
  const lines: InterCityLine[] = [];
  let totalFee = 0;
  let hasInterCity = false;
  for (let k = 1; k < plans.length; k++) {
    const from = plans[k - 1]?.city?.trim();
    const to = plans[k]?.city?.trim();
    if (!from || !to || from === to) continue;
    hasInterCity = true;
    const mode = plans[k]?.transport ?? "rail";
    const pricePerPerson =
      mode === "flight" ? pricing.intercityPricePerPerson.flight : pricing.intercityPricePerPerson.rail;
    const fee = pricePerPerson * headcount;
    totalFee += fee;
    lines.push({
      dayFrom: k,
      dayTo: k + 1,
      fromCity: from,
      toCity: to,
      mode,
      pricePerPerson,
      headcount,
      fee,
    });
  }
  return { lines, totalFee, hasInterCity };
}
