/**
 * AI Analysis Utility Functions
 * Helper functions for building comprehensive AI context and calculations
 */

/**
 * Calculate growth rate percentage between two values
 * @param oldValue - Previous period value
 * @param newValue - Current period value
 * @returns Growth rate as percentage (e.g., 15.5 for 15.5% growth)
 */
export const calculateGrowthRate = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Format period for display
 * @param month - Month number (1-12)
 * @param year - Year (e.g., 2026)
 * @returns Formatted string like "Tháng 1/2026"
 */
export const formatPeriod = (month: number, year: number): string => {
  return `Tháng ${month}/${year}`;
};

/**
 * Round to 1 decimal place
 */
export const round1 = (value: number): number => {
  return Math.round(value * 10) / 10;
};

/**
 * Safe number conversion
 */
export const toNum = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};
