
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
  pendingElectricityMeter?: number; // Chỉ số chốt chờ lập hóa đơn
  pendingWaterMeter?: number;       // Chỉ số chốt chờ lập hóa đơn
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
  
  // Occupation & Vehicle
  occupation?: string;         // Nghề nghiệp
  licensePlate?: string;       // Biển số xe
  vehicleType?: string;        // Loại xe
  
  // Emergency Contact
  emergencyContact?: string;   // Số ĐT người thân
  emergencyName?: string;      // Tên người thân
  
  // Rental Info
  roomId?: string;
  startDate: string;
  contractDraft?: string;      // Lưu bản thảo hợp đồng AI
  notes?: string;              // Ghi chú thêm
  isRepresentative?: boolean;  // Người đại diện phòng
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
  electricityUsage: number;
  electricityCost: number;
  waterUsage: number;
  waterCost: number;
  createdAt: string;
}

// Added missing Expense interface definition
export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;               // Ngày thực tế chi tiền
  month: number;              // Kỳ tháng hạch toán
  year: number;               // Năm hạch toán
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
  bankId: string;
  bankAccount: string;
  bankOwner: string;
  houseRules: string;
  qrPrefix?: string;
  // Landlord Information
  landlordName?: string;
  landlordPhone?: string;
  landlordIdCard?: string;
  landlordAddress?: string;
}

export type ViewType = 'dashboard' | 'rooms' | 'tenants' | 'invoices' | 'expenses' | 'incidents' | 'settings' | 'ai-assistant' | 'tenant-portal';
