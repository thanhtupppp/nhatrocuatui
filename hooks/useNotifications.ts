import { useMemo } from 'react';
import { Invoice } from '../types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info';
  date: string;
}

export const useNotifications = (invoices: Invoice[]) => {
  const notifications = useMemo(() => {
    const list: AppNotification[] = [];
    const now = new Date();
    
    // Check for overdue invoices (unpaid from current month or before)
    const unpaidInvoices = invoices.filter(inv => !inv.paid);
    
    unpaidInvoices.forEach(inv => {
      const invDate = new Date(inv.createdAt);
      const isPastMonth = inv.year < now.getFullYear() || (inv.year === now.getFullYear() && inv.month < now.getMonth() + 1);
      
      if (isPastMonth) {
        list.push({
          id: `overdue-${inv.id}`,
          title: 'Hóa đơn quá hạn',
          message: `Kỳ ${inv.month}/${inv.year} chưa được thanh toán.`,
          type: 'error',
          date: inv.createdAt
        });
      } else if (unpaidInvoices.length > 0) {
          // You could add logic for "near due" or just general "unpaid"
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices]);

  return notifications;
};
