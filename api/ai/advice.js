import Groq from "groq-sdk";

// Vercel Serverless Function for AI Advice
// API Key is stored securely in Vercel Environment Variables
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const context = req.body;

    // Validate input
    if (!context || typeof context.occupancyRate !== 'number') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

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
    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    const advice = JSON.parse(content);
    return res.status(200).json(advice);

  } catch (error) {
    console.error("Groq API Error:", error);
    return res.status(500).json({ 
      error: 'AI service unavailable',
      details: error.message 
    });
  }
}
