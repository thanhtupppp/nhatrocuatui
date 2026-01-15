import { useMemo } from 'react';
import { Room, Invoice, Expense } from '../types';
import { RoomStatus } from '../constants/enums';

interface DashboardStats {
  month: number;
  year: number;
  occupancyRate: number;
  revenue: number;
  expense: number;
  profit: number;
  profitMargin: number;
  prevRevenue: number;
}

/**
 * Custom hook để tính toán Dashboard statistics
 * Tách logic ra khỏi component để dễ test và maintain
 */
export const useDashboardStats = (
  rooms: Room[],
  invoices: Invoice[],
  expenses: Expense[]
): DashboardStats => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Previous Month Calculation
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const occupancyRate = useMemo(() => {
    if (!rooms.length) return 0;
    const occupiedCount = rooms.filter(r => r.status === RoomStatus.OCCUPIED).length;
    return Math.round((occupiedCount / rooms.length) * 100);
  }, [rooms]);

  const revenue = useMemo(() => {
    return invoices
      .filter(i => i.month === month && i.year === year && i.paid)
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices, month, year]);

  const prevRevenue = useMemo(() => {
    return invoices
      .filter(i => i.month === prevMonth && i.year === prevYear && i.paid)
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices, prevMonth, prevYear]);

  const expense = useMemo(() => {
    const monthStr = String(month).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    
    return expenses
      .filter(e => e.date.startsWith(prefix))
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses, month, year]);

  const profit = useMemo(() => revenue - expense, [revenue, expense]);

  const profitMargin = useMemo(() => {
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  }, [revenue, profit]);

  return {
    month,
    year,
    occupancyRate,
    revenue,
    expense,
    profit,
    profitMargin,
    prevRevenue
  };
};
