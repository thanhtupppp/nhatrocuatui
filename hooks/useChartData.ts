
import { useMemo } from 'react';
import { Invoice, Expense } from '../types';
import { getCurrentPeriod, getPreviousPeriod } from '../utils/dateUtils';
import { toNum } from '../utils/financialUtils';

interface ChartDataPoint {
  name: string;
  revenue: number;
  expense: number;
}

const HISTORY_MONTHS = 6;

export const useChartData = (
  invoices: Invoice[],
  expenses: Expense[]
): ChartDataPoint[] => {
  return useMemo(() => {
    const current = getCurrentPeriod();
    const data: ChartDataPoint[] = [];

    // Pre-calculate maps for speed
    const revMap = new Map<string, number>();
    invoices.forEach(inv => {
      if (!inv.paid) return;
      const key = `${inv.year}-${inv.month}`;
      revMap.set(key, (revMap.get(key) || 0) + toNum(inv.total));
    });

    const expMap = new Map<string, number>();
    expenses.forEach(exp => {
      const key = `${exp.year}-${exp.month}`;
      expMap.set(key, (expMap.get(key) || 0) + toNum(exp.amount));
    });

    // Backfill history
    let period = current;
    for (let i = 0; i < HISTORY_MONTHS; i++) {
      const key = `${period.year}-${period.month}`;
      data.unshift({
        name: `T${period.month}`,
        revenue: revMap.get(key) || 0,
        expense: expMap.get(key) || 0
      });
      period = getPreviousPeriod(period.month, period.year);
    }

    return data;
  }, [invoices, expenses]);
};
