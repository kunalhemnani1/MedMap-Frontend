import { Readable } from "stream";
import { AssemblyAI } from "assemblyai";
import recorder from "node-record-lpcm16";

type VisitSession = {
    final: string;
    interim: string;
    transcriber?: unknown;
    recording?: unknown;
};

type Recording = {
    stop: () => void;
    stream: () => Readable;
};

type StreamingTranscriber = {
    connect: () => Promise<void>;
    close: () => Promise<void>;
    stream: () => WritableStream<Uint8Array>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
};

// Shared in-process store: visitId → { transcriber, recording, final, interim }
// globalThis.__visitSessions is also read by /api/record-visit/transcript
const sessions: Map<string, VisitSession> = globalThis.__visitSessions ?? new Map();
globalThis.__visitSessions = sessions;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const body = (await request.json().catch(() => ({}))) as { action?: "start" | "stop"; visitId?: string };
    const { action, visitId } = body;

    if (!action || !["start", "stop"].includes(action)) {
        return Response.json({ error: 'action must be "start" or "stop"' }, { status: 400 });
    }

    // ── START ────────────────────────────────────────────────────────────────
    if (action === "start") {
        const assemblyKey = process.env.ASSEMBLYAI_API_KEY;
        if (!assemblyKey) {
            return Response.json({ error: "ASSEMBLYAI_API_KEY not set" }, { status: 500 });
        }

        const id = visitId || `visit_${Date.now()}`;
        if (sessions.has(id)) {
            return Response.json({ error: `Session ${id} is already active` }, { status: 409 });
        }

        try {
            const client = new AssemblyAI({ apiKey: assemblyKey });
            const transcriber = client.streaming.transcriber({
                speechModel: "u3-rt-pro",
                sampleRate: 16_000,
            }) as unknown as StreamingTranscriber;

            // Seed the session so the poll endpoint can find it immediately
            const sessionData: VisitSession = { transcriber, recording: null, final: "", interim: "" };
            sessions.set(id, sessionData);

            transcriber.on("open", (payload: unknown) => {
                const p = payload as { id?: string; sessionId?: string } | null;
                const sid = p?.id ?? p?.sessionId;
                console.log(`[record-visit] AssemblyAI session opened: ${sid ?? "(unknown)"}`);
            });

            transcriber.on("error", (error: unknown) => {
                console.error("[record-visit] AssemblyAI error:", error);
            });

            transcriber.on("close", (code: unknown, reason: unknown) => {
                console.log("[record-visit] AssemblyAI session closed:", code, reason);
            });

            transcriber.on("turn", (turn: unknown) => {
                const t = turn as { transcript?: unknown; turn_is_formatted?: unknown };
                if (!t.transcript) return;
                const data = sessions.get(id);
                if (!data) return;
                if (t.turn_is_formatted) {
                    // Completed turn → append to final transcript, clear interim
                    data.final = data.final
                        ? `${data.final} ${String(t.transcript)}`
                        : String(t.transcript);
                    data.interim = "";
                } else {
                    // In-progress turn → show as live interim caption
                    data.interim = String(t.transcript);
                }
            });

            await transcriber.connect();

            const recording = recorder.record({
                channels: 1,
                sampleRate: 16_000,
                audioType: "wav",
            }) as unknown as Recording;

            sessionData.recording = recording;
            const nodeReadable = recording.stream() as unknown as Readable;
            Readable.toWeb(nodeReadable).pipeTo(transcriber.stream());

            return Response.json({ status: "recording", visitId: id });
        } catch (err: unknown) {
            sessions.delete(id);
            console.error("[record-visit] Failed to start:", err);
            return Response.json(
                { error: "Failed to start recording", details: err instanceof Error ? err.message : String(err) },
                { status: 500 }
            );
        }
    }

    // ── STOP ─────────────────────────────────────────────────────────────────
    if (action === "stop") {
        if (!visitId) {
            return Response.json({ error: "visitId is required when action=stop" }, { status: 400 });
        }

        const sessionData = sessions.get(visitId);
        if (!sessionData) {
            return Response.json({ error: `No active session: ${visitId}` }, { status: 404 });
        }

        try {
            if (sessionData.recording) (sessionData.recording as Recording).stop();
            await (sessionData.transcriber as StreamingTranscriber).close();
            const transcript = sessionData.final.trim();
            sessions.delete(visitId);

            return Response.json({ status: "stopped", visitId, transcript });
        } catch (err: unknown) {
            sessions.delete(visitId);
            console.error("[record-visit] Failed to stop:", err);
            return Response.json(
                { error: "Failed to stop recording", details: err instanceof Error ? err.message : String(err) },
                { status: 500 }
            );
        }
    }
}