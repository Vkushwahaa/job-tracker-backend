// services/aiParser.js
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("Gemini key loaded:", !!process.env.GEMINI_API_KEY);

function extractJSON(text) {
  // Removes ```json ... ``` and any surrounding text
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

/**
 * STRICT schema — AI MUST match this or we reject it
 */
const ParsedEmailSchema = z.object({
  company: z.object({
    name: z.string().min(1).nullable(),
  }),
  job: z.object({
    title: z.string().min(1).nullable(),
  }),
  inferredStatus: z
    .enum(["applied", "interview", "offer", "rejected"])
    .nullable(),
  detection: z.object({
    score: z.number().min(0).max(100),
    reasons: z.array(z.string()),
  }),
  note: z.string().nullable(),
});

/**
 * AI Email Parser using Gemini
 */
export async function aiParseEmail({ subject, from, textBody, htmlBody }) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // fast + free tier friendly
  });

  const prompt = `
You are an information extraction system.

Extract job application details from an email.
Return ONLY valid JSON matching this schema:

{
  "company": { "name": string | null },
  "job": { "title": string | null },
  "inferredStatus": "applied" | "interview" | "offer" | "rejected" | null,
  "detection": {
    "score": number (0-100),
    "reasons": string[]
  },
  "note": string | null
}

Rules:
- If unsure, use null
- Do NOT invent company names
- Score should reflect confidence
- Score < 40 if likely not a job application
- Return JSON ONLY, no text

Email:
From: ${from}
Subject: ${subject}

Body:
${textBody || htmlBody || ""}
`;

  let rawText;

  try {
    const result = await model.generateContent(prompt);
    rawText = result.response.text();
    console.log("RAW GEMINI OUTPUT:\n", rawText);

    //   } catch (err) {
    //     throw new Error("Gemini API failed");
    //   }
  } catch (err) {
    console.error("FULL GEMINI ERROR:", err);
    throw new Error(err.message || "Gemini API failed");
  }

  let parsed;
  const jsonText = extractJSON(rawText);

  if (!jsonText) {
    throw new Error("No JSON object found in AI response");
  }

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("AI did not return valid JSON");
  }
  const validated = ParsedEmailSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error(
      "AI response failed validation: " +
        JSON.stringify(validated.error.format())
    );
  }

  return validated.data;
}
