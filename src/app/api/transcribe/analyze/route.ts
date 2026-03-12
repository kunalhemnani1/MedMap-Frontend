import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a compassionate medical visit assistant helping patients understand their doctor's appointment.

Given the transcript of a clinical visit and some details about the visit, produce a clear, patient-friendly summary in Markdown.

Structure your response with these sections (use ## headings):
- **Visit Overview** — who, when, why
- **What the Doctor Said** — key points from the consultation in plain language
- **Diagnosis / Assessment** — any diagnoses, test results, or findings mentioned
- **Medications & Treatment** — any prescriptions, dosages, or treatments discussed
- **Follow-up & Action Items** — what the patient needs to do next (tests, referrals, lifestyle changes)
- **Important Warnings** — anything urgent the patient must watch for

Write clearly for a non-medical audience. Avoid jargon. Be accurate to what was said — do not invent information.
If a section has no relevant content, omit it.`;

export async function POST(request: Request) {
    const body = await request.json();
    const { transcript, details } = body;

    if (!transcript || !transcript.trim()) {
        return Response.json({ error: "transcript is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
    }

    const contextBlock = [
        details?.patientName && `Patient: ${details.patientName}`,
        details?.doctorName && `Doctor: Dr. ${details.doctorName}${details.doctorSpecialty ? ` (${details.doctorSpecialty})` : ""}`,
        details?.hospitalName && `Hospital: ${details.hospitalName}`,
        details?.department && `Department: ${details.department}`,
        details?.appointmentId && `Appointment ID: ${details.appointmentId}`,
        details?.notes && `Reason / Notes: ${details.notes}`,
    ].filter(Boolean).join("\n");

    const userMessage = `${contextBlock ? `Visit Context:\n${contextBlock}\n\n` : ""}Transcript:\n${transcript}`;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
            systemInstruction: SYSTEM_PROMPT,
        });

        const result = await model.generateContent(userMessage);
        const summary = result.response.text();

        return Response.json({ summary });
    } catch (err: unknown) {
        console.error("[analyse] Gemini error:", err);
        return Response.json(
            { error: "Failed to generate summary", details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}