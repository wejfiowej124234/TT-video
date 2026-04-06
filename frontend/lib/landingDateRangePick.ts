/**
 * 首页出行日期区间：日历两次点击逻辑（54-S11）。
 * 先选为出发、后选为结束；若第二次早于第一次则改为新出发日；第三次点击重新开始。
 */

export type LandingDateRangePickResult = {
  startDate: string;
  endDate: string;
  /** 已选满起止日时关闭弹层 */
  shouldCloseCalendar: boolean;
};

export function applyLandingDatePick(params: {
  picked: string;
  minDate: string;
  startDate: string;
  endDate: string;
}): LandingDateRangePickResult {
  const { picked, minDate, startDate, endDate } = params;
  if (!picked || picked < minDate) {
    return { startDate, endDate, shouldCloseCalendar: false };
  }
  if (!startDate) {
    return { startDate: picked, endDate: "", shouldCloseCalendar: false };
  }
  if (!endDate) {
    if (picked >= startDate) {
      return { startDate, endDate: picked, shouldCloseCalendar: true };
    }
    return { startDate: picked, endDate: "", shouldCloseCalendar: false };
  }
  return { startDate: picked, endDate: "", shouldCloseCalendar: false };
}
