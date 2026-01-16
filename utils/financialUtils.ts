
/**
 * Financial Calculation Utilities
 * Pure functions for business metrics aggregation
 */

import { Invoice, Expense } from '../types';
import { Period, isSamePeriod } from './dateUtils';

/**
 * Robustly converts any value to a number, defaulting to 0
 */
export const toNum = (val: any): number => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

/**
 * Sums numeric field in an array of records for a specific period
 */
export const sumByPeriod = (
  items: (Invoice | Expense)[], 
  period: Period, 
  filterFn?: (item: any) => boolean
): number => {
  return items
    .filter(item => {
      // Logic đồng nhất với UI: Ưu tiên month/year, fallback parse từ date
      const itemMonth = (item as any).month || ( (item as any).date ? new Date((item as any).date).getMonth() + 1 : null );
      const itemYear = (item as any).year || ( (item as any).date ? new Date((item as any).date).getFullYear() : null );
      
      const itemPeriod = { 
        month: itemMonth, 
        year: itemYear 
      };
      const periodMatches = isSamePeriod(itemPeriod, period);
      return filterFn ? (periodMatches && filterFn(item)) : periodMatches;
    })
    .reduce((sum, item) => sum + toNum((item as any).total || (item as any).amount), 0);
};

/**
 * Formats currency in VND
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};
