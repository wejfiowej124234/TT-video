import { useRef, useEffect, useState, useCallback, useId } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { applyLandingDatePick } from "@/lib/landingDateRangePick";
import { dateToString } from "./constants";
import { formatLandingHeroDisplayRange, getLandingHeroCalendarGrid } from "./landingHeroFormDateRangeUtils";

export interface UseLandingHeroFormDateRangePickerArgs {
  startDate: string;
  endDate: string;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
}

export interface UseLandingHeroFormDateRangePickerResult {
  calendarDialogTitleId: string;
  calendarDialogDescId: string;
  calendarOpen: boolean;
  setCalendarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCalendarMonth: React.Dispatch<React.SetStateAction<Date>>;
  calendarRef: React.RefObject<HTMLDivElement | null>;
  closeCalendar: () => void;
  calendarTrapRef: React.RefObject<HTMLDivElement | null>;
  minDate: string;
  handleCalendarDay: (date: string) => void;
  displayRange: string | null;
  calendarDays: ReturnType<typeof getLandingHeroCalendarGrid>;
  monthLabel: string;
}

export function useLandingHeroFormDateRangePicker({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: UseLandingHeroFormDateRangePickerArgs): UseLandingHeroFormDateRangePickerResult {
  const calendarDialogTitleId = useId();
  const calendarDialogDescId = useId();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  const closeCalendar = useCallback(() => setCalendarOpen(false), []);
  const calendarTrapRef = useFocusTrap(calendarOpen, closeCalendar);

  const minDate = dateToString(new Date());

  const handleCalendarDay = useCallback(
    (date: string) => {
      const r = applyLandingDatePick({
        picked: date,
        minDate,
        startDate,
        endDate,
      });
      setStartDate(r.startDate);
      setEndDate(r.endDate);
      if (r.shouldCloseCalendar) closeCalendar();
    },
    [minDate, startDate, endDate, setStartDate, setEndDate, closeCalendar]
  );

  useEffect(() => {
    if (!calendarOpen) return;
    const close = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) closeCalendar();
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [calendarOpen, closeCalendar]);

  const displayRange = formatLandingHeroDisplayRange(startDate, endDate);
  const calendarDays = getLandingHeroCalendarGrid(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const monthLabel = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return {
    calendarDialogTitleId,
    calendarDialogDescId,
    calendarOpen,
    setCalendarOpen,
    setCalendarMonth,
    calendarRef,
    closeCalendar,
    calendarTrapRef,
    minDate,
    handleCalendarDay,
    displayRange,
    calendarDays,
    monthLabel,
  };
}
