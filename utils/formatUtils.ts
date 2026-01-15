/**
 * Format number to Vietnamese Currency (VND)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount).replace('₫', 'đ');
};

/**
 * Format string date to dd/mm/yyyy
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN').format(date);
  } catch (e) {
    return 'N/A';
  }
};

/**
 * Format date to Month/Year for invoice billing cycle
 */
export const formatBillingCycle = (month: number, year: number): string => {
  return `${month}/${year}`;
};
