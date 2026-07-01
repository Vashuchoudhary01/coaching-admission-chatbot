export const runtime = "nodejs";

import Groq from "groq-sdk";
import { knowledgeBase } from "@/data/knowledge";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You are a college admission assistant.

Use ONLY the information provided below to answer questions.

College Knowledge Base:
${JSON.stringify(knowledgeBase, null, 2)}

Instructions:
- Answer in a friendly and professional manner.
- If information is unavailable, say so politely.
- Do not make up courses, fees, scholarships, or admission details.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.3,
      max_tokens: 512,
    });

    
const reply = completion.choices[0].message.content || "";

const feeNote =
  "\n\n📞 To know more about the complete fee structure, available scholarships, and the latest discounts or offers, please share your Name and Mobile Number. Our admission counselor will contact you shortly and assist you with the admission process.";

const finalReply =
  message.toLowerCase().includes("fee") ||
  message.toLowerCase().includes("fees") ||
  message.toLowerCase().includes("cost") ||
  message.toLowerCase().includes("price")
    ? reply + feeNote
    : reply;

return Response.json({
  reply: finalReply,
});
  } catch (error) {
    console.error("Groq Error:", error);

    return Response.json(
      {
        reply: "Sorry, I am unable to process your request right now.",
      },
      { status: 500 }
    );
  }
}