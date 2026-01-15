
export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE'
}

export interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  depositAmount: number;
  status: RoomStatus;
  tenantId?: string;
  description?: string;
  electricityMeter: number;
  waterMeter: number;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email?: string;
  
  // CCCD Information
  idCard: string;              // Số CCCD
  idCardFrontImage?: string;   // Ảnh mặt trước CCCD (base64 hoặc URL)
  idCardBackImage?: string;    // Ảnh mặt sau CCCD (base64 hoặc URL)
  dateOfBirth?: string;        // Ngày sinh
  gender?: 'male' | 'female';  // Giới tính
  
  // Address
  hometown: string;            // Quê quán
  currentAddress?: string;     // Địa chỉ hiện tại
  
  // Emergency Contact
  emergencyContact?: string;   // Số ĐT người thân
  emergencyName?: string;      // Tên người thân
  
  // Rental Info
  roomId?: string;
  startDate: string;
  contractDraft?: string;      // Lưu bản thảo hợp đồng AI
}

export interface Invoice {
  id: string;
  roomId: string;
  month: number;
  year: number;
  rentAmount: number;
  oldElectricity: number;
  newElectricity: number;
  electricityRate: number;
  oldWater: number;
  newWater: number;
  waterRate: number;
  internetFee: number;
  trashFee: number;
  otherFees: number;
  total: number;
  paid: boolean;
  createdAt: string;
}

// Added missing Expense interface definition
export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  createdAt: any;
}

export interface Incident {
  id: string;
  roomId: string;
  tenantName: string;
  title: string;
  description: string;
  status: 'PENDING' | 'FIXING' | 'DONE';
  createdAt: string;
}

export interface SystemSettings {
  electricityRate: number;
  waterRate: number;
  internetFee: number;
  trashFee: number;
  bankId: string; // Tên viết tắt ngân hàng (VCB, MB...)
  bankAccount: string;
  bankOwner: string;
  houseRules: string; // Nội quy nhà trọ
  qrPrefix?: string;  // Tiền tố nội dung chuyển khoản
}

export type ViewType = 'dashboard' | 'rooms' | 'tenants' | 'invoices' | 'expenses' | 'settings' | 'ai-assistant' | 'tenant-portal';
