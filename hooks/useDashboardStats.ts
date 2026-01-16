
import { useMemo } from 'react';
import { Room, Invoice, Expense } from '../types';
import { getPreviousPeriod, isSamePeriod } from '../utils/dateUtils';
import { sumByPeriod, toNum } from '../utils/financialUtils';

interface DashboardStats {
  month: number;
  year: number;
  occupancyRate: number;
  totalBilled: number;     // Tổng cộng đã lập hóa đơn (Billed)
  collectedRevenue: number; // Thực tế đã thu (Paid)
  revenue: number;          // Phục vụ tương thích ngược (giữ là collectedRevenue)
  expense: number;
  profit: number;
  profitMargin: number;
  prevRevenue: number;
  totalElectricityUsage: number;
  totalElectricityCost: number;
  totalWaterUsage: number;
  totalWaterCost: number;
  utilityElectricityBill: number; // Tiền điện thực trả cho nhà cung cấp
  utilityWaterBill: number;       // Tiền nước thực trả cho nhà cung cấp
}

/**
 * Hook to calculate dashboard statistics
 * Uses centralized pure functions for reliable financial data
 */
export const useDashboardStats = (
  rooms: Room[],
  invoices: Invoice[],
  expenses: Expense[],
  month: number,
  year: number
): DashboardStats => {
  const currentPeriod = { month, year };
  const prevPeriod = getPreviousPeriod(month, year);

  return useMemo(() => {
    // 1. Occupancy Logic
    const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;
    const occupancyRate = rooms.length > 0 ? Math.round((occupiedCount / rooms.length) * 100) : 0;

    // 2. Revenue Calculations
    const totalBilled = sumByPeriod(invoices, currentPeriod);
    const collectedRevenue = sumByPeriod(invoices, currentPeriod, (inv) => inv.paid);
    const prevRevenue = sumByPeriod(invoices, prevPeriod, (inv) => inv.paid);

    // 3. Expense & Profit Logic
    const expense = sumByPeriod(expenses, currentPeriod);
    const profit = collectedRevenue - expense;
    const profitMargin = collectedRevenue > 0 ? (profit / collectedRevenue) * 100 : 0;

    // 4. Utility Usage Aggregation
    const periodInvoices = invoices.filter(i => isSamePeriod({ month: Number(i.month), year: Number(i.year) }, currentPeriod));
    const totalElectricityUsage = periodInvoices.reduce((sum, i) => sum + toNum(i.electricityUsage), 0);
    const totalElectricityCost = periodInvoices.reduce((sum, i) => sum + toNum(i.electricityCost), 0);
    const totalWaterUsage = periodInvoices.reduce((sum, i) => sum + toNum(i.waterUsage), 0);
    const totalWaterCost = periodInvoices.reduce((sum, i) => sum + toNum(i.waterCost), 0);

    // 5. Utility Bill Aggregation (Cost paid to supplier)
    const utilityElectricityBill = expenses
      .filter(e => e.category === 'Điện' && isSamePeriod({ month: Number(e.month), year: Number(e.year) }, currentPeriod))
      .reduce((sum, e) => sum + toNum(e.amount), 0);
      
    const utilityWaterBill = expenses
      .filter(e => e.category === 'Nước' && isSamePeriod({ month: Number(e.month), year: Number(e.year) }, currentPeriod))
      .reduce((sum, e) => sum + toNum(e.amount), 0);

    return {
      month,
      year,
      occupancyRate,
      totalBilled,
      collectedRevenue,
      revenue: collectedRevenue,
      expense,
      profit,
      profitMargin,
      prevRevenue,
      totalElectricityUsage,
      totalElectricityCost,
      totalWaterUsage,
      totalWaterCost,
      utilityElectricityBill,
      utilityWaterBill
    };
  }, [rooms, invoices, expenses, month, year]);
};
