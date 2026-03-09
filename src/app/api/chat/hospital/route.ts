import { NextResponse } from "next/server";

export async function POST(_req: Request) {
    return NextResponse.json({
        text: "The AI assistant is temporarily unavailable. Please use the search and filters above to find hospitals.",
    });
}

/* ── AI chatbot (temporarily disabled) ────────────────────────────────────────
import { GoogleGenAI } from "@google/genai";
import { searchHospitals } from "@/lib/searchHospitals";

export async function POST(req: Request) {
    try {
        const { message, searchParams } = await req.json();

        const searchResults = await searchHospitals({
            query: searchParams.query,
            state: searchParams.state,
            district: searchParams.district,
            pincode: searchParams.pincode,
            limit: 5,
        });

        const context = JSON.stringify(searchResults.results);

        const prompt = `
        You are an AI assistant for MedMap, helping users find hospitals.
        
        User Query: "${message}"
        
        Here are the relevant hospital search results found in our database based on the user's current view:
        ${context}
        
        Instructions:
        1. Answer the user's query using ONLY the information provided in the search results above.
        2. If the user asks for a recommendation, suggest hospitals from the list based on their specific needs (e.g., location, type).
        3. Highlight key details like address, phone number, or emergency number if relevant.
        4. If the search results are empty or don't contain the answer, politely state that you couldn't find relevant information in the current search results.
        5. Keep the response concise, helpful, and friendly.
        6. Do not mention "JSON" or "database" in your response; speak naturally.
        `;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Chatbot api key not configured");
        const ai = new GoogleGenAI({ apiKey });

        const resp = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        return NextResponse.json({ text: resp.text });
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
── end disabled block ──────────────────────────────────────────────────────── */
