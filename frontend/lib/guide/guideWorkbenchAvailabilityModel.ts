export type GuideOccupiedRange = {
  start_date: string;
  end_date: string;
};

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

function isYmdInRange(ymd: string, start: string, end: string): boolean {
  return ymd >= start && ymd <= end;
}

function isOccupied(ymd: string, ranges: GuideOccupiedRange[]): boolean {
  return ranges.some((r) => isYmdInRange(ymd, r.start_date, r.end_date));
}

/** 本月已占用天数（含今日及未来；不含已过去的占用日不计入可经营提示） */
export function countGuideOccupiedDaysThisMonth(
  ranges: GuideOccupiedRange[],
  now: Date = new Date(),
): { occupied: number; totalFutureOrToday: number } {
  const year = now.getFullYear();
  const month0 = now.getMonth();
  const todayYmd = toYmd(now);
  const dim = daysInMonth(year, month0);
  let occupied = 0;
  let totalFutureOrToday = 0;
  for (let day = 1; day <= dim; day++) {
    const ymd = `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (ymd < todayYmd) continue;
    totalFutureOrToday += 1;
    if (isOccupied(ymd, ranges)) occupied += 1;
  }
  return { occupied, totalFutureOrToday };
}
