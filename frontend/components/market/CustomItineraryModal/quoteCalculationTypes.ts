/** 报价计算相关类型（从 useQuoteCalculation 拆出，供 tourist/guide 子模块使用） */
import type { CityTransportType, TransportType } from "./types";

export interface TransportLine {
  dayFrom: number;
  dayTo: number;
  vehicle: CityTransportType;
  fee: number;
}

export interface InterCityLine {
  dayFrom: number;
  dayTo: number;
  mode: TransportType;
  pricePerPerson: number;
  headcount: number;
  fee: number;
}

export interface GuideQuoteBreakdown {
  attractionTotal: number;
  foodTotal: number;
  hotelTotal: number;
  guideTotal: number;
  transportTotal: number;
  cityTransportFee: number;
  interCityFee: number;
  headcount: number;
  total: number;
  perDay: number;
  days: number;
}

export interface BudgetBreakdown {
  attractionsTotal: number;
  foodTotal: number;
  hotelTotal: number;
  hotelNights: number;
  transportTotal: number;
  guideTotal: number;
  total: number;
  perDay: number;
  days: number;
  headcount: number;
  attractionCount: number;
  foodCount: number;
}
