import { NextResponse } from "next/server";

export async function POST(_req: Request) {
    return NextResponse.json({
        text: "The AI assistant is temporarily unavailable. Please use the search and filters to find hospitals.",
    });
}

/* ── AI chatbot (temporarily disabled) ────────────────────────────────────────
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const { message } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Chatbot api key not configured");
        const ai = new GoogleGenAI({ apiKey });
        const resp = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: message + "Respond according to message history",
        });
        return NextResponse.json({ text: resp.text });
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
── end disabled block ──────────────────────────────────────────────────────── */
