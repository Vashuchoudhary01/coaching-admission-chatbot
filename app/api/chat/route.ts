export const runtime = "nodejs";
import { GoogleGenAI } from "@google/genai";
import { knowledgeBase } from "@/data/knowledge";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const prompt = `
You are a college admission assistant.

Use ONLY the information provided below to answer questions.

College Knowledge Base:
${JSON.stringify(knowledgeBase, null, 2)}

Student Question:
${message}

Instructions:
- Answer in a friendly and professional manner.
- If information is unavailable, say so politely.
- Do not make up courses, fees, scholarships, or admission details.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return Response.json({
      reply: response.text,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    return Response.json(
      {
        reply: "Sorry, I am unable to process your request right now.",
      },
      { status: 500 }
    );
  }
}