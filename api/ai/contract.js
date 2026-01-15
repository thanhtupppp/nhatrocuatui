import Groq from "groq-sdk";

// Vercel Serverless Function for Contract Generation
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const { tenantName, roomName, price, startDate } = req.body;

    if (!tenantName || !roomName || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

    const contract = response.choices[0]?.message?.content || "";
    return res.status(200).json({ contract });

  } catch (error) {
    console.error("Groq API Error:", error);
    return res.status(500).json({ 
      error: 'AI service unavailable',
      details: error.message 
    });
  }
}
