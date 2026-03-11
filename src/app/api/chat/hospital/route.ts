import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { searchHospitals } from "@/lib/searchHospitals";

function buildInsightPrompt(
    searchContext: { query?: string | null; state?: string | null; district?: string | null; pincode?: string | null },
    hospitals: Array<Record<string, unknown>>
): string {
    const location = [searchContext.district, searchContext.state].filter(Boolean).join(", ") || searchContext.pincode || "your area";
    const query = searchContext.query || "hospitals";

    const summaries = hospitals.slice(0, 8).map((h) => {
        const fees = Array.isArray(h.consultation_fee_range)
            ? `₹${(h.consultation_fee_range as number[])[0]}–₹${(h.consultation_fee_range as number[])[1]}`
            : "price not listed";
        return `- ${h.name} (${h.type ?? "Hospital"}, ${h.district ?? h.city ?? ""}): consultation ${fees}, beds: ${h.beds ?? "N/A"}, insurance: ${h.accepts_insurance ? "yes" : "no"}, emergency: ${h.has_emergency ? "yes" : "no"}`;
    }).join("\n");

    return `You are MedMap's AI Insight engine. Your job is to give a SHORT, price-focused summary of hospital search results.

Search: "${query}" in ${location}
Results (${hospitals.length} total, showing up to 8):
${summaries || "No hospitals found in the database for this search."}

Your response MUST:
1. Open with a one-line price range overview (e.g., "Consultation fees range from ₹300 to ₹1,500 in this area.")
2. Highlight the most affordable option and the highest-rated option if they differ
3. Mention insurance acceptance rate (X out of Y accept insurance)
4. Note emergency availability if relevant
5. End with one actionable tip (e.g., "Filter by insurance" or "Sort by price to find the cheapest option")
6. Use **bold** for hospital names and prices
7. Keep total length under 120 words — be punchy, not verbose
8. Never say "JSON", "database", or "search results"; speak as if you know this area naturally
`;
}

export async function POST(req: Request) {
    try {
        const { message, searchParams } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ text: "AI insights require a GEMINI_API_KEY environment variable." });
        }

        const searchResults = await searchHospitals({
            query: searchParams?.query,
            state: searchParams?.state,
            district: searchParams?.district,
            pincode: searchParams?.pincode,
            limit: 8,
        });

        const prompt = buildInsightPrompt(searchParams ?? {}, searchResults.results as Array<Record<string, unknown>>);

        const ai = new GoogleGenAI({ apiKey });
        const resp = await ai.models.generateContent({
            model: "gemma-3-27b",
            contents: prompt + (message ? `\n\nUser also asked: "${message}"` : ""),
        });

        return NextResponse.json({ text: resp.text });
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
