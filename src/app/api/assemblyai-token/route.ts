import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function createToken() {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "AssemblyAI API key is not configured." },
            { status: 503 }
        );
    }

    const response = await fetch("https://api.assemblyai.com/v2/streaming/token", {
        method: "POST",
        headers: {
            Authorization: apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ expires_in: 3600 }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("AssemblyAI token error:", err);
        return NextResponse.json(
            { error: "Failed to get transcription token." },
            { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json({ token: data.token });
}

export async function GET() {
    try {
        return await createToken();
    } catch (err: unknown) {
        console.error("AssemblyAI token error:", err);
        const message = err instanceof Error ? err.message : "Failed to create token";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST() {
    try {
        return await createToken();
    } catch (err: unknown) {
        console.error("AssemblyAI token error:", err);
        const message = err instanceof Error ? err.message : "Failed to create token";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
