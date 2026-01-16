
/**
 * Date and Period Utilities
 * Centralized logic for business month/year attribution (Accrual basis)
 */

export interface Period {
  month: number;
  year: number;
}

/**
 * Returns the current period based on system time
 */
export const getCurrentPeriod = (): Period => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
};

/**
 * Derives business period from a date string (YYYY-MM-DD or ISO)
 */
export const getPeriodFromDate = (dateStr: string): Period => {
  const date = new Date(dateStr);
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear()
  };
};

/**
 * Calculates the previous period relative to a given one
 */
export const getPreviousPeriod = (month: number, year: number): Period => {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return { month: prevMonth, year: prevYear };
};

/**
 * Standard format for period display (e.g., "T12 / 2023")
 */
export const formatPeriod = (month: number, year: number): string => {
  return `T${month} / ${year}`;
};

/**
 * Robust numeric comparison to avoid string/number mismatch
 */
export const isSamePeriod = (p1: Period, p2: Period): boolean => {
  return Number(p1.month) === Number(p2.month) && Number(p1.year) === Number(p2.year);
};
