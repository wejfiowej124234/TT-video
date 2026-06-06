import { dateToString } from "./constants";

export type LandingHeroCalendarCell = { date: string; day: number; isCurrentMonth: boolean };

export function getLandingHeroCalendarGrid(year: number, month: number): LandingHeroCalendarCell[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const rows: LandingHeroCalendarCell[] = [];
  for (let i = 0; i < startPad; i++) rows.push({ date: "", day: 0, isCurrentMonth: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = dateToString(new Date(year, month, d));
    rows.push({ date, day: d, isCurrentMonth: true });
  }
  return rows;
}

export function formatLandingHeroDisplayRange(startDate: string, endDate: string): string | null {
  if (startDate && endDate) {
    return `${startDate.replace(/-/g, "/")} － ${endDate.replace(/-/g, "/")}`;
  }
  if (startDate) {
    return `${startDate.replace(/-/g, "/")} － ...`;
  }
  return null;
}
