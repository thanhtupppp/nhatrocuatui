// =============================================================================
// AI Service - Smart Environment Detection
// =============================================================================
// - Development (local): Uses Groq SDK directly (for testing)
// - Production (Vercel): Calls secure Backend API
// =============================================================================

import Groq from "groq-sdk";

const isDevelopment = import.meta.env.DEV;

export interface AIAnalysisContext {
  // Current Period (selected month)
  currentPeriod: {
    month: number;
    year: number;
    occupancyRate: number;
    totalBilled: number;        // Total invoiced amount
    collectedRevenue: number;   // Actually paid by tenants
    expense: number;
    profit: number;
    profitMargin: number;
    totalRooms: number;
    occupiedRooms: number;
    
    // Utilities efficiency
    electricityRevenue: number;  // Collected from tenants
    electricityExpense: number;  // Paid to supplier
    waterRevenue: number;
    waterExpense: number;
  };
  
  // Previous Period (last month)
  previousPeriod: {
    month: number;
    year: number;
    occupancyRate: number;
    collectedRevenue: number;
    expense: number;
    profit: number;
    profitMargin: number;
  };
  
  // Calculated Trends
  trends: {
    revenueGrowth: number;      // % change
    expenseGrowth: number;      // % change
    profitGrowth: number;       // % change
    occupancyChange: number;    // % points change
    collectionEfficiency: number; // % of billed actually collected
  };
}


export interface AIAdviceResponse {
  healthScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  risks: string[];
  opportunities: string[];
}

// Development: Direct Groq SDK (for local testing)
const getAIAdviceDev = async (context: AIAnalysisContext): Promise<AIAdviceResponse | null> => {
  try {
    const groq = new Groq({ 
      apiKey: import.meta.env.VITE_GROQ_API_KEY, 
      dangerouslyAllowBrowser: true 
    });

    const { currentPeriod: curr, previousPeriod: prev, trends } = context;
    
    // Calculate utility margins
    const elecMargin = curr.electricityRevenue - curr.electricityExpense;
    const waterMargin = curr.waterRevenue - curr.waterExpense;
    const collectionRate = curr.totalBilled > 0 
      ? (curr.collectedRevenue / curr.totalBilled * 100).toFixed(1) 
      : '0';

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Bạn là **AI Advisor Pro** – Trợ lý Chiến lược cấp cao cho hệ thống quản lý nhà trọ.

Vai trò: Cố vấn phân tích – suy luận – đề xuất chiến lược dựa trên dữ liệu thực tế.

## MỤC TIÊU CỐT LÕI
- Phân tích dữ liệu đầu vào (doanh thu, chi phí, hiệu suất, xu hướng)
- Nhận diện vấn đề – cơ hội – rủi ro
- Đưa ra khuyến nghị chiến lược rõ ràng, có thể hành động
- Hỗ trợ ra quyết định cho chủ nhà trọ

## NGUYÊN TẮC SUY LUẬN
1. Dữ liệu là trung tâm – mọi kết luận phải dựa trên dữ liệu đầu vào
2. Không đủ dữ liệu → nói rõ là chưa đủ
3. Ưu tiên hành động thực tế
4. Luôn cảnh báo rủi ro trước khi khuyến nghị
5. So sánh – phân tích – rồi mới đề xuất

## PHÂN TÍCH DỮ LIỆU
Bạn sẽ nhận dữ liệu so sánh giữa:
- THÁNG TRƯỚC (dữ liệu hoàn chỉnh)
- THÁNG HIỆN TẠI (đang diễn ra)

Phân tích các lĩnh vực:
1. Xu hướng doanh thu và chi phí
2. Tỷ lệ lấp đầy và hiệu suất phòng
3. Hiệu quả thu tiền (đã lập vs đã thu)
4. Biên lợi nhuận điện nước
5. Dòng tiền và thanh khoản

## CẤU TRÚC TRẢ LỜI (JSON)
{
  "healthScore": number (0-100, đánh giá tổng thể: <50=cần cảnh báo, 50-75=ổn định, >75=tốt),
  "sentiment": "positive" | "neutral" | "negative",
  "summary": "Tóm tắt tình hình hiện tại và xu hướng chính (2-3 câu, có số liệu cụ thể)",
  "risks": [
    "Rủi ro ngắn hạn cụ thể (nếu có)",
    "Rủi ro trung/dài hạn (nếu có)", 
    "Cảnh báo điểm bất thường (nếu có)"
  ],
  "opportunities": [
    "Hành động ưu tiên số 1 (cụ thể, có thể thực hiện)",
    "Chiến lược tối ưu số 2",
    "Gợi ý cải thiện số 3"
  ]
}

## QUY TẮC
- Giọng điệu: Chuyên nghiệp, rõ ràng, không cảm xúc dư thừa
- Nội dung: Dựa trên dữ liệu, có số liệu, có thể hành động
- Rủi ro: Nêu rõ điều kiện xảy ra và mức độ ảnh hưởng
- Khuyến nghị: Ưu tiên hành động có tác động cao, dễ thực hiện
- Nếu thiếu dữ liệu quan trọng: Nói rõ và đề xuất cần theo dõi thêm`
        },
        {
          role: "user",
          content: `
THÁNG TRƯỚC (${prev.month}/${prev.year}) - DỮ LIỆU HOÀN CHỈNH:
- Doanh thu thực thu: ${prev.collectedRevenue.toLocaleString()} VNĐ
- Chi phí: ${prev.expense.toLocaleString()} VNĐ
- Lợi nhuận: ${prev.profit.toLocaleString()} VNĐ
- Biên lợi nhuận: ${prev.profitMargin.toFixed(1)}%
- Tỷ lệ lấp đầy: ${prev.occupancyRate}%

THÁNG HIỆN TẠI (${curr.month}/${curr.year}) - ĐANG DIỄN RA:
- Tỷ lệ lấp đầy: ${curr.occupancyRate}% (${curr.occupiedRooms}/${curr.totalRooms} phòng)
- Đã lập hóa đơn: ${curr.totalBilled.toLocaleString()} VNĐ
- Thực tế đã thu: ${curr.collectedRevenue.toLocaleString()} VNĐ (Tỷ lệ thu ${collectionRate}%)
- Chi phí: ${curr.expense.toLocaleString()} VNĐ
- Lợi nhuận: ${curr.profit.toLocaleString()} VNĐ
- Biên lợi nhuận: ${curr.profitMargin.toFixed(1)}%

HIỆU QUẢ ĐIỆN NƯỚC:
- Điện: Thu từ khách ${curr.electricityRevenue.toLocaleString()} - Chi trả ${curr.electricityExpense.toLocaleString()} = Lãi ${elecMargin.toLocaleString()} VNĐ
- Nước: Thu từ khách ${curr.waterRevenue.toLocaleString()} - Chi trả ${curr.waterExpense.toLocaleString()} = Lãi ${waterMargin.toLocaleString()} VNĐ

XU HƯỚNG (So với tháng trước):
- Doanh thu: ${trends.revenueGrowth > 0 ? '+' : ''}${trends.revenueGrowth.toFixed(1)}%
- Chi phí: ${trends.expenseGrowth > 0 ? '+' : ''}${trends.expenseGrowth.toFixed(1)}%
- Lợi nhuận: ${trends.profitGrowth > 0 ? '+' : ''}${trends.profitGrowth.toFixed(1)}%
- Tỷ lệ lấp đầy: ${trends.occupancyChange > 0 ? '+' : ''}${trends.occupancyChange.toFixed(1)} điểm %
- Hiệu quả thu tiền: ${trends.collectionEfficiency.toFixed(1)}%

Hãy cung cấp phân tích chiến lược và khuyến nghị hành động cụ thể.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });


    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    
    return JSON.parse(content) as AIAdviceResponse;
  } catch (error) {
    console.error("Groq Error (Dev):", error);
    return null;
  }
};

// Production: Secure Backend API
const getAIAdviceProd = async (context: AIAnalysisContext): Promise<AIAdviceResponse | null> => {
  try {
    const response = await fetch('/api/ai/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    });

    if (!response.ok) return null;
    return await response.json() as AIAdviceResponse;
  } catch (error) {
    console.error('AI API Error:', error);
    return null;
  }
};

// Export: Auto-select based on environment
export const getAIAdvice = isDevelopment ? getAIAdviceDev : getAIAdviceProd;

// Contract Generation (same pattern)
export const generateRentalContract = async (
  tenantName: string, 
  roomName: string, 
  price: number, 
  startDate: string
): Promise<string> => {
  if (isDevelopment) {
    try {
      const groq = new Groq({ 
        apiKey: import.meta.env.VITE_GROQ_API_KEY, 
        dangerouslyAllowBrowser: true 
      });

      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `Hãy soạn thảo một bản hợp đồng thuê nhà trọ ngắn gọn, chuyên nghiệp dựa trên thông tin sau: 
            - Tên người thuê: ${tenantName}
            - Tên phòng: ${roomName}
            - Giá thuê: ${price.toLocaleString('vi-VN')} VNĐ/tháng
            - Ngày bắt đầu: ${startDate}. 
            Bao gồm các điều khoản cơ bản về tiền đặt cọc, thanh toán và trách nhiệm giữ gìn tài sản.`
          }
        ],
        model: "llama-3.3-70b-versatile",
      });
      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Groq Error (Dev):", error);
      return "Không thể khởi tạo AI vào lúc này.";
    }
  } else {
    try {
      const response = await fetch('/api/ai/contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantName, roomName, price, startDate }),
      });
      if (!response.ok) return "Không thể khởi tạo AI vào lúc này.";
      const data = await response.json();
      return data.contract || '';
    } catch {
      return "Không thể khởi tạo AI vào lúc này.";
    }
  }
};
