
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRentalContract = async (tenantName: string, roomName: string, price: number, startDate: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Hãy soạn thảo một bản hợp đồng thuê nhà trọ ngắn gọn, chuyên nghiệp dựa trên thông tin sau: 
      - Tên người thuê: ${tenantName}
      - Tên phòng: ${roomName}
      - Giá thuê: ${price.toLocaleString('vi-VN')} VNĐ/tháng
      - Ngày bắt đầu: ${startDate}. 
      Bao gồm các điều khoản cơ bản về tiền đặt cọc, thanh toán và trách nhiệm giữ gìn tài sản.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Không thể khởi tạo AI vào lúc này. Vui lòng thử lại sau.";
  }
};

export const getAIAdvice = async (occupancyRate: number, totalRevenue: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Với tư cách là một chuyên gia kinh doanh bất động sản, hãy cho lời khuyên ngắn gọn cho một chủ nhà trọ có:
      - Tỷ lệ lấp đầy: ${occupancyRate.toFixed(1)}%
      - Doanh thu hiện tại: ${totalRevenue.toLocaleString('vi-VN')} VNĐ.
      Hãy đề xuất cách tối ưu lợi nhuận hoặc thu hút khách hàng. Trả lời bằng tiếng Việt.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
