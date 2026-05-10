import { GoogleGenAI, Type } from "@google/genai";
import { AiIntelligencePayload } from "../types";

// Use import.meta.env for Vite consistency if possible, fallback to process.env
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.API_KEY || '';
// Lazy initialization to avoid errors when API_KEY is missing
let aiInstance: GoogleGenAI | null = null;
const getAi = () => {
  if (!aiInstance && API_KEY) {
    aiInstance = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiInstance;
};

export interface IntelligenceInsight {
  type: 'recommendation' | 'anomaly' | 'forecast';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

export const analyzeIntelligence = async (data: AiIntelligencePayload): Promise<IntelligenceInsight[]> => {
  if (!API_KEY) {
    return [
      {
        type: 'recommendation',
        title: 'API Key Missing',
        description: 'Gemini AI is not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.',
        impact: 'low',
        suggestion: 'Contact system administrator.'
      }
    ];
  }

  try {
    const prompt = `
      You are an expert Property Management Data Scientist. Analyze the following operational data and provide 4 high-value insights in JSON format.
      Focus on:
      1. Rent Recommendations (Prices vs Occupancy)
      2. Operational Anomalies (Utility outliers or collection variances)
      3. Revenue Forecasting (Upcoming lease expiries)

      DATA:
      - Rooms: ${JSON.stringify(data.rooms)}
      - Leases: ${JSON.stringify(data.leases)}
      - Revenue History: ${JSON.stringify(data.revenue)}
      - Utility Samples: ${JSON.stringify(data.utilities)}

      OUTPUT SCHEMA:
      Array of { "type", "title", "description", "impact", "suggestion" }
      - type: "recommendation", "anomaly", or "forecast"
      - impact: "high", "medium", or "low"
    `;

    const client = getAi();
    if (!client) throw new Error("GoogleGenAI client not initialized.");

    const result = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["recommendation", "anomaly", "forecast"] },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              impact: { type: Type.STRING, enum: ["high", "medium", "low"] },
              suggestion: { type: Type.STRING }
            },
            required: ["type", "title", "description", "impact", "suggestion"]
          }
        }
      }
    });

    const text = result.text;
    return JSON.parse(text || "[]");
  } catch (error) {
    console.error("Gemini Intelligence Error:", error);
    return [
      {
        type: 'anomaly',
        title: 'Analysis Interrupted',
        description: 'We encountered an error while processing the deep data metrics.',
        impact: 'medium',
        suggestion: 'Try again in a few minutes.'
      }
    ];
  }
};

/**
 * Legacy support for simple dashboard insights
 */
export const getInsights = async (stats: any) => {
  try {
    const client = getAi();
    if (!client) return ["Verify account balances.", "Check building security.", "Schedule utility audits."];

    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `As a property management assistant, provide 3 prioritized action items for: Occupancy: ${stats.occupancy}%, Unpaid: ${stats.unpaidCount}. Respond in a JSON array of strings.`
    });
    const text = response.text;
    // Simplified parsing for legacy
    try {
        return JSON.parse(text);
    } catch {
        return ["Monitor collection rates.", "Review maintenance schedule.", "Update tenant records."];
    }
  } catch (error) {
    return ["Verify account balances.", "Check building security.", "Schedule utility audits."];
  }
};
