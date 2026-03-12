import { NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";

export async function GET() {
    try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "AssemblyAI API key is not configured." },
                { status: 503 }
            );
        }

        const client = new AssemblyAI({ apiKey });
        const token = await client.realtime.createTemporaryToken({ expires_in: 3600 });

        return NextResponse.json({ token });
    } catch (err: unknown) {
        console.error("AssemblyAI token error:", err);
        const message = err instanceof Error ? err.message : "Failed to create token";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
