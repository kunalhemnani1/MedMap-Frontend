import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SUMMARY_PROMPT = `You are a compassionate medical visit companion helping patients understand what happened during their doctor's appointment.

Given the transcript of a doctor's visit, create a clear, organised summary in simple, plain language - avoid medical jargon wherever possible.

Structure your response in markdown using this exact format:

## What the Doctor Found
A brief, plain-language description of the diagnosis or condition discussed.

## Key Points from Your Visit
- Bullet list of the most important things the doctor said

## Medications
- List any prescribed medications with dosage/instructions if mentioned
- Write "None mentioned" if no medications were discussed

## Tests / Investigations Ordered
- List any tests, scans, or lab work ordered
- Write "None mentioned" if no tests were ordered

## Your Next Steps
- What the patient should do at home
- Lifestyle or diet changes
- When to come back

## Important Warnings
- Any urgent symptoms to watch for
- When to seek emergency care
- Write "None mentioned" if no warnings were given

---
*This summary is generated from a spoken transcript and may not capture every detail. Always follow your doctor's written instructions.*`;

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 503 });
        }

        const { transcript, context } = await req.json() as { transcript: string; context?: string };

        if (!transcript || transcript.trim().length < 10) {
            return NextResponse.json({ error: "Transcript is too short or empty." }, { status: 400 });
        }

        const contextNote = context ? `\n\nAdditional context from the patient:\n${context}` : "";
        const prompt = `${SUMMARY_PROMPT}${contextNote}\n\nHere is the transcript of the medical visit:\n\n---\n${transcript}\n---\n\nPlease provide the structured summary in markdown.`;

        const ai = new GoogleGenAI({ apiKey });
        const resp = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        const summary = resp.text ?? "Summary could not be generated.";
        return NextResponse.json({ summary });
    } catch (err: unknown) {
        console.error("Transcribe route error:", err);
        const message = err instanceof Error ? err.message : "Summary generation failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}