import { GoogleGenerativeAI } from "@google/generative-ai";

const ANALYSIS_PROMPT = `You are a medical/clinical visit assistant. Analyze the following transcribed visit conversation and extract structured insights.

Provide a JSON response with this exact structure:
{
  "summary": "Brief 2-3 sentence summary of the visit",
  "chiefComplaint": "Main reason for the visit",
  "symptoms": ["list", "of", "reported", "symptoms"],
  "keyFindings": ["important", "observations", "or", "findings"],
  "actionItems": ["follow-up", "actions", "or", "recommendations"],
  "sentiment": "positive | neutral | negative",
  "duration": "estimated visit duration based on content",
  "tags": ["relevant", "topic", "tags"]
}

Transcript:
`;

export async function analyzeTranscript(apiKey: string, transcript: string) {
    if (!transcript || transcript.trim().length === 0) {
        return {
            summary: "No transcript content to analyze.",
            chiefComplaint: "N/A",
            symptoms: [],
            keyFindings: [],
            actionItems: [],
            sentiment: "neutral",
            duration: "unknown",
            tags: [],
        };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(ANALYSIS_PROMPT + transcript);
    const text = result.response.text();

    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();

    return JSON.parse(cleaned);
}