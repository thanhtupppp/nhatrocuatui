// =============================================================================
// AI Service - Smart Environment Detection
// =============================================================================
// - Development (local): Uses Groq SDK directly (for testing)
// - Production (Vercel): Calls secure Backend API
// =============================================================================

import Groq from "groq-sdk";

const isDevelopment = import.meta.env.DEV;

export interface AIAnalysisContext {
  occupancyRate: number;
  revenue: number;
  expense: number;
  profit: number;
  profitMargin: number;
  prevRevenue: number;
  totalRooms: number;
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

    const revenueGrowth = context.prevRevenue > 0 
      ? ((context.revenue - context.prevRevenue) / context.prevRevenue) * 100 
      : 0;

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a Senior Real Estate Impact Analyst. 
Analyze the input data and return a JSON object ONLY. No markdown, no explanations outside the JSON.
Response format:
{
  "healthScore": number (0-100),
  "sentiment": "positive" | "neutral" | "negative",
  "summary": "Detailed analysis in Vietnamese (max 2 sentences)",
  "risks": ["Risk 1 (Vietnamese)", "Risk 2 (Vietnamese)"],
  "opportunities": ["Action 1 (Vietnamese)", "Action 2 (Vietnamese)"]
}`
        },
        {
          role: "user",
          content: `Data:
- Occupancy: ${context.occupancyRate.toFixed(1)}% (${context.totalRooms} rooms)
- Revenue: ${context.revenue} VND
- Expense: ${context.expense} VND
- Profit: ${context.profit} VND
- Margin: ${context.profitMargin.toFixed(1)}%
- MoM Growth: ${revenueGrowth.toFixed(1)}%`
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
