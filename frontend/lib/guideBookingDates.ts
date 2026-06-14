/** 游客预约档期（YYYY-MM-DD）· 与 `GET …/availability` occupied_ranges 同源校验 */

export type GuideOccupiedRangeYmd = {
  start_date: string;
  end_date: string;
};

export function isYmdInRange(ymd: string, start: string, end: string): boolean {
  return ymd >= start && ymd <= end;
}

export function rangesOverlapYmd(a: GuideOccupiedRangeYmd, b: GuideOccupiedRangeYmd): boolean {
  return a.start_date <= b.end_date && b.start_date <= a.end_date;
}

/** 所选出行区间是否与已占用档期重叠 */
export function tripRangeOverlapsOccupied(
  start: string,
  end: string,
  occupied: GuideOccupiedRangeYmd[],
): boolean {
  if (!start || !end || end < start) return false;
  const trip: GuideOccupiedRangeYmd = { start_date: start, end_date: end };
  return occupied.some((r) => rangesOverlapYmd(trip, r));
}

export function normalizeTripRange(
  start: string | null | undefined,
  end: string | null | undefined,
): { start: string; end: string } | null {
  const s = (start ?? "").trim();
  const e = (end ?? "").trim();
  if (!s || !e || e < s) return null;
  return { start: s, end: e };
}

export function formatTripRangeLabel(start: string, end: string, locale: string): string {
  const tag = locale === "zh" ? "zh-CN" : "en-US";
  const fmt = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(tag, { month: "short", day: "numeric", year: "numeric" });
  };
  if (start === end) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function addDaysYmd(startYmd: string, dayOffset: number): string {
  const [y, m, d] = startYmd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + dayOffset);
  return dt.toISOString().slice(0, 10);
}

function positiveIntDays(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
    const n = Number.parseInt(raw.trim(), 10);
    return n > 0 ? n : undefined;
  }
  return undefined;
}

/** 从订单头 + 行程包推导出行区间（与后端 `parse_itinerary_date_range` 同源） */
export function resolveOrderTripDatesYmd(input: {
  order?: Record<string, unknown> | null;
  itinerary?: { daily_itinerary?: unknown[] } | null;
}): { start: string; end: string } | null {
  const order = input.order;
  if (!order || typeof order !== "object") return null;

  const startRaw = typeof order.start_date === "string" ? order.start_date.trim() : "";
  const endRaw = typeof order.end_date === "string" ? order.end_date.trim() : "";
  if (YMD_RE.test(startRaw) && YMD_RE.test(endRaw) && endRaw >= startRaw) {
    return { start: startRaw, end: endRaw };
  }

  const travel = typeof order.travel_date === "string" ? order.travel_date.trim() : "";
  if (!YMD_RE.test(travel)) return null;

  let days = positiveIntDays(order.days);
  if (days == null && input.itinerary?.daily_itinerary?.length) {
    days = input.itinerary.daily_itinerary.length;
  }
  days = Math.min(365, Math.max(1, days ?? 1));
  return { start: travel, end: addDaysYmd(travel, days - 1) };
}

/** `GET /api/v1/orders/:id` 成功体 → 出行区间 */
export function resolveOrderTripDatesFromGetOrderPayload(data: unknown): { start: string; end: string } | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const order = row.order;
  const itinerary = row.itinerary;
  return resolveOrderTripDatesYmd({
    order: order && typeof order === "object" ? (order as Record<string, unknown>) : null,
    itinerary: itinerary && typeof itinerary === "object" ? (itinerary as { daily_itinerary?: unknown[] }) : null,
  });
}
