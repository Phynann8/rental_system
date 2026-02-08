
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getInsights = async (stats: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `As a property management assistant, analyze these stats and provide 3 prioritized action items:
      - Total Buildings: ${stats.totalBuildings}
      - Total Occupancy: ${stats.occupancy}%
      - Unpaid Invoices: ${stats.unpaidCount} ($${stats.unpaidAmount})
      - Active Tenants: ${stats.activeTenants}
      
      Respond in a concise JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["Review overdue invoices immediately.", "Follow up on maintenance requests.", "Update room inventory status."];
  }
};
