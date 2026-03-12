import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type VisitDetails = {
    patientName?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    hospitalName?: string;
    department?: string;
    appointmentId?: string;
    notes?: string;
};

function asObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request) {
    const bodyUnknown = (await request.json().catch(() => ({}))) as unknown;
    const bodyObj = asObject(bodyUnknown) ?? {};
    const transcript = asString(bodyObj.transcript);
    const detailsObj = asObject(bodyObj.details);
    const details: VisitDetails = {
        patientName: asString(detailsObj?.patientName),
        doctorName: asString(detailsObj?.doctorName),
        doctorSpecialty: asString(detailsObj?.doctorSpecialty),
        hospitalName: asString(detailsObj?.hospitalName),
        department: asString(detailsObj?.department),
        appointmentId: asString(detailsObj?.appointmentId),
        notes: asString(detailsObj?.notes),
    };

    if (!transcript || !transcript.trim()) {
        return Response.json({ error: "transcript is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
    }

    const contextBlock = [
        details.patientName && `Patient: ${details.patientName}`,
        details.doctorName &&
        `Doctor: Dr. ${details.doctorName}${details.doctorSpecialty ? ` (${details.doctorSpecialty})` : ""}`,
        details.hospitalName && `Hospital: ${details.hospitalName}`,
        details.department && `Department: ${details.department}`,
        details.appointmentId && `Appointment ID: ${details.appointmentId}`,
        details.notes && `Reason / Notes: ${details.notes}`,
    ]
        .filter(Boolean)
        .join("\n");

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
        console.error("[record-visit/analyse] Gemini error:", err);
        return Response.json(
            {
                error: "Failed to generate summary",
                details: err instanceof Error ? err.message : String(err),
            },
            { status: 500 }
        );
    }
}
