/**
 * Room Status Enum
 */
export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED'
}

/**
 * Invoice Status Enum
 */
export enum InvoiceStatus {
  PAID = 'paid',
  UNPAID = 'unpaid'
}

/**
 * Expense Category Enum
 */
export enum ExpenseCategory {
  REPAIR = 'Sửa chữa',
  UTILITY = 'Tiện ích', 
  OTHER = 'Khác'
}

/**
 * System Constants
 */
export const CONSTANTS = {
  CHART_MONTHS: 6,
  DEFAULT_CHART_HEIGHT: 400,
  MONTHS_PER_YEAR: 12
} as const;
