import { GoogleGenAI } from "@google/genai";
import { LineItem, LineItemCategory } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const systemInstruction = `
You are an expert film and video production estimator. 
Your goal is to help videographers estimate project costs accurately based on location and project scope.
You have knowledge of current market rates for crew, equipment, and post-production services.
`;

const chatSystemInstruction = `
You are an expert video production producer and estimator.
Your goal is to formulate a precise budget estimate for the user AS QUICKLY AS POSSIBLE.

PROTOCOL:
1. PREFER ACTION OVER QUESTIONS. Generate a baseline estimate immediately based on the user's prompt.
2. Only ask a question if the request is completely unintelligible.
3. If budget is not specified, assume a standard professional rate for the region.
4. If scope is vague (e.g. "music video"), infer standard crew/gear needs (DP, Cam Op, Gaffer, Location, Editing) and generate the list.
5. SPECIAL RULE: If the project is identified as a WEDDING, DOUBLE the standard market rates for all roles and services (high pressure/no-retake premium).
6. Default editing rate is approx $350/day unless specified otherwise (or doubled for weddings).
7. CREW HIERARCHY RULE: The primary camera user is ALWAYS the "Director of Photography" (A-Cam). If a second camera operator is needed, list them as "Camera Operator" (B-Cam). NEVER list "2 Camera Operators". Example for 2 cams: 1 Director of Photography, 1 Camera Operator.

OUTPUT FORMAT:
When generating the estimate, return ONLY a JSON object.
Structure:
{
  "items": [
    {
      "description": "string",
      "category": "Pre-Production" | "Production" | "Post-Production" | "Equipment & Rentals" | "Expenses" | "Other",
      "quantity": number,
      "rate": number,
      "unit": "day" | "hour" | "flat" | "item"
    }
  ],
  "reasoning": "string (summary of the approach)"
}
`;

const shotListSystemInstruction = `
You are SER.0, an expert Director of Photography and Assistant Director.
Your goal is to help the user create a structured SHOT LIST for a video shoot.

PROTOCOL:
1. Ask 1-2 concise questions at a time to understand the scene, the subject, the mood, and the location.
2. Suggest creative angles (Low angle, Dutch angle, Top-down) and movements (Dolly in, Truck left, Orbit) based on their description.
3. When you have enough information OR if the user asks for the list, generate the JSON object.

OUTPUT FORMAT:
If you are chatting, return plain text.
If you are generating the final list, return ONLY a JSON object with this structure:
{
  "projectTitle": "string",
  "scenes": [
    {
      "sceneNumber": "string",
      "location": "string",
      "description": "string",
      "shots": [
        {
          "shotNumber": 1,
          "size": "WS" | "MS" | "CU" | "ECU",
          "type": "Static" | "Handheld" | "Gimbal" | "Dolly",
          "description": "string (visual description)",
          "notes": "string (lens choice, lighting notes)"
        }
      ]
    }
  ]
}
`;

const callSheetSystemInstruction = `
You are SER.0, an expert Assistant Director and Producer.
Your goal is to help the user create a structured CALL SHEET for a video shoot.

PROTOCOL:
1. Ask concise questions to get the Project Title, Date, General Call Time, Location, and Crew roles needed.
2. Ask about the Schedule (key events like Call, Lunch, Wrap).
3. When you have enough information OR if the user asks for the sheet, generate the JSON object.

OUTPUT FORMAT:
If you are chatting, return plain text.
If you are generating the final call sheet, return ONLY a JSON object with this structure:
{
  "projectTitle": "string",
  "client": "string",
  "shootDate": "string",
  "generalCallTime": "string",
  "location": "string",
  "weather": "string",
  "crew": [
    { "role": "string", "name": "string", "phone": "string", "email": "string", "callTime": "string" }
  ],
  "talent": [
    { "role": "string", "name": "string", "callTime": "string", "notes": "string" }
  ],
  "schedule": [
    { "time": "string", "activity": "string", "location": "string", "notes": "string" }
  ],
  "locations": {
      "address": "string",
      "parking": "string",
      "hospital": "string"
  },
  "notes": "string"
}
`;

export const createEstimatorChat = (location: string) => {
  if (!apiKey) throw new Error("API Key missing");
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: chatSystemInstruction + ` Current Location context: ${location}.`,
      tools: [{ googleSearch: {} }],
    }
  });
};

export const createShotListChat = () => {
  if (!apiKey) throw new Error("API Key missing");
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: shotListSystemInstruction,
    }
  });
};

export const createCallSheetChat = () => {
  if (!apiKey) throw new Error("API Key missing");
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: callSheetSystemInstruction,
    }
  });
};

export const parseEstimateResponse = (text: string): { items?: Partial<LineItem>[]; reasoning?: string; isEstimate: boolean } => {
    let data;
    try {
        // Try parsing the whole text first
        data = JSON.parse(text);
    } catch (e) {
        // Try finding JSON block
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                data = JSON.parse(jsonMatch[0]);
            } catch (err) {
                return { isEstimate: false };
            }
        } else {
            return { isEstimate: false };
        }
    }

    if (!data || !data.items) return { isEstimate: false };

    const mappedItems = (data.items || []).map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      taxable: true,
      category: Object.values(LineItemCategory).includes(item.category) 
        ? item.category 
        : LineItemCategory.OTHER,
      quantity: Number(item.quantity) || 1,
      rate: Number(item.rate) || 0,
      unit: item.unit || 'day'
    }));

    return {
        items: mappedItems,
        reasoning: data.reasoning,
        isEstimate: true
    };
};

export const parseShotListResponse = (text: string): { data: any, isShotList: boolean } => {
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                data = JSON.parse(jsonMatch[0]);
            } catch (err) {
                return { data: null, isShotList: false };
            }
        } else {
            return { data: null, isShotList: false };
        }
    }

    if (!data || !data.scenes) return { data: null, isShotList: false };
    return { data, isShotList: true };
};

export const parseCallSheetResponse = (text: string): { data: any, isCallSheet: boolean } => {
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                data = JSON.parse(jsonMatch[0]);
            } catch (err) {
                return { data: null, isCallSheet: false };
            }
        } else {
            return { data: null, isCallSheet: false };
        }
    }

    if (!data || (!data.crew && !data.schedule)) return { data: null, isCallSheet: false };
    return { data, isCallSheet: true };
};

export const generateSingleLineItem = async (description: string, location: string): Promise<Partial<LineItem>> => {
  if (!apiKey) throw new Error("API Key missing");

  const prompt = `
  Create a single line item for a video production budget based on this description: "${description}". 
  Location: ${location}.
  
  Rule: If the description or context implies a WEDDING, double the standard market rate.
  Rule: Default Video Editor rate is $350/day (or $700 if wedding).
  Rule: Primary camera op is "Director of Photography". Secondary is "Camera Operator".

  Return ONLY a valid JSON object.
  Structure:
  {
      "description": "string (refined title)",
      "category": "Pre-Production" | "Production" | "Post-Production" | "Equipment & Rentals" | "Expenses" | "Other",
      "quantity": number (default 1),
      "rate": number (estimated market rate),
      "unit": "day" | "hour" | "flat" | "item"
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) data = JSON.parse(jsonMatch[0]);
    }

    if (!data) throw new Error("Invalid JSON");

    return {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        taxable: true,
        category: Object.values(LineItemCategory).includes(data.category) 
        ? data.category 
        : LineItemCategory.OTHER,
        quantity: Number(data.quantity) || 1,
        rate: Number(data.rate) || 0,
        unit: data.unit || 'day'
    };

  } catch (error) {
    console.error("Single Item Gen Error:", error);
    throw error;
  }
};

export const generateStoryboardSketch = async (description: string, shotType: string): Promise<string | null> => {
  if (!apiKey) throw new Error("API Key missing");

  const prompt = `
  Create a simple, black and white storyboard sketch for a film shot.
  Style: Rough pencil sketch, cinematic aspect ratio, minimalist.
  Shot Description: ${description}.
  Shot Size: ${shotType}.
  Do not include text in the image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "16:9",
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;

  } catch (error) {
    console.error("Storyboard Gen Error:", error);
    return null;
  }
};

// Legacy single-shot function (kept for reference or fallback)
export const analyzeProjectDescription = async (
  description: string,
  location: string
): Promise<{ items: Partial<LineItem>[]; reasoning: string; sources?: {web?: {uri: string; title: string}}[] }> => {
  if (!apiKey) throw new Error("API Key missing");

  const prompt = `
  Analyze this video project request and generate a detailed list of line items with estimated rates for the location: ${location}.
  Project Description: "${description}"

  Use the googleSearch tool to find current local rates if possible.

  Return ONLY a valid JSON object. Do not include any other text or markdown formatting.
  The JSON must match this structure:
  {
    "items": [
      {
        "description": "string (e.g. Director of Photography)",
        "category": "Pre-Production" | "Production" | "Post-Production" | "Equipment & Rentals" | "Expenses" | "Other",
        "quantity": number,
        "rate": number (numeric value only),
        "unit": "day" | "hour" | "flat"
      }
    ],
    "reasoning": "string (brief summary of scope)"
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const parsed = parseEstimateResponse(text);
    if (!parsed.isEstimate) throw new Error("Failed to parse JSON response");

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk) || [];

    return {
      items: parsed.items || [],
      reasoning: parsed.reasoning || "No reasoning provided.",
      sources
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const getLocalRates = async (location: string, roles: string[]): Promise<{ rates: any[], sources: any[] }> => {
  if (!apiKey) throw new Error("API Key missing");

  const prompt = `
  Find the current average daily rates for the following video production roles in ${location}: ${roles.join(', ')}.
  
  Return ONLY a valid JSON object. Do not include any other text or markdown formatting.
  Structure:
  {
      "rates": [
          {
              "role": "string",
              "averageRate": number,
              "currency": "string"
          }
      ]
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    if (!text) return { rates: [], sources: [] };
    
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
        } else {
            return { rates: [], sources: [] };
        }
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { rates: data.rates || [], sources };

  } catch (error) {
    console.error("Gemini Rate Fetch Error:", error);
    return { rates: [], sources: [] };
  }
};