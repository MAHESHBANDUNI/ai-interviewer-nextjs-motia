import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = process.env.GEMINI_API_KEY1;

if (!GEMINI_KEY) {
  throw new Error("GEMINI_API_KEY not configured");
}

const ai = new GoogleGenerativeAI(GEMINI_KEY);

export async function callGemini(prompt) {
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  const response = await model.generateContent(prompt);
  return response.response;
}
