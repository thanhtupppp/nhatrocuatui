import React from 'react';
import { Download } from 'lucide-react';
import Button from '../UI/Button';

interface ExportData {
  month: string;
  revenue: number;
  expense: number;
  profit: number;
}

interface ExportButtonProps {
  data: ExportData[];
  filename?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = React.memo(({ data, filename = 'bao-cao-tai-chinh' }) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    // CSV Headers
    const headers = ['Tháng', 'Doanh thu (VNĐ)', 'Chi phí (VNĐ)', 'Lợi nhuận (VNĐ)'];
    
    // CSV Rows
    const rows = data.map(row => [
      row.month,
      row.revenue.toString(),
      row.expense.toString(),
      row.profit.toString()
    ]);

    // Add summary row
    const totalRevenue = data.reduce((sum, r) => sum + r.revenue, 0);
    const totalExpense = data.reduce((sum, r) => sum + r.expense, 0);
    const totalProfit = totalRevenue - totalExpense;
    rows.push(['TỔNG CỘNG', totalRevenue.toString(), totalExpense.toString(), totalProfit.toString()]);

    // Build CSV content with BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers, ...rows].map(row => row.join(',')).join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={handleExport}
      variant="secondary"
      className="!bg-slate-100 hover:!bg-slate-200 !text-slate-700 !font-semibold !shadow-sm gap-2"
    >
      <Download size={16} />
      Xuất báo cáo
    </Button>
  );
});

ExportButton.displayName = 'ExportButton';
