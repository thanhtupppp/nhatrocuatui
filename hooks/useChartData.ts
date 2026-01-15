import { useMemo } from 'react';
import { Invoice, Expense } from '../types';
import { CONSTANTS } from '../constants/enums';

interface ChartDataPoint {
  name: string;
  revenue: number;
  expense: number;
}

/**
 * Custom hook để tạo chart data với performance tốt hơn
 * Sử dụng Map để optimize việc filter/reduce
 */
export const useChartData = (
  invoices: Invoice[],
  expenses: Expense[]
): ChartDataPoint[] => {
  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Pre-group invoices by month-year key
    const revenueMap = new Map<string, number>();
    invoices.forEach(inv => {
      if (!inv.paid) return;
      const key = `${inv.year}-${inv.month}`;
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + inv.total);
    });

    // Pre-group expenses by month-year key  
    const expenseMap = new Map<string, number>();
    expenses.forEach(exp => {
      const [year, month] = exp.date.split('-');
      const key = `${year}-${parseInt(month)}`;
      expenseMap.set(key, (expenseMap.get(key) ?? 0) + exp.amount);
    });

    // Generate chart data for last N months
    const data: ChartDataPoint[] = [];
    
    for (let i = CONSTANTS.CHART_MONTHS - 1; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;

      if (m <= 0) {
        m += CONSTANTS.MONTHS_PER_YEAR;
        y -= 1;
      }

      const key = `${y}-${m}`;
      const monthName = `T${m}`;

      data.push({
        name: monthName,
        revenue: revenueMap.get(key) ?? 0,
        expense: expenseMap.get(key) ?? 0
      });
    }

    return data;
  }, [invoices, expenses]);
};
