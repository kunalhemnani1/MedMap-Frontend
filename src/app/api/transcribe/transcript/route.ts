// GET /api/record-visit/transcript?visitId=...
// Returns the current accumulated transcript turns for a live session.
// The page polls this every 800ms to show live captions.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sessions = globalThis.__visitSessions ?? new Map();
globalThis.__visitSessions = sessions;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const visitId = searchParams.get("visitId");

    if (!visitId) {
        return Response.json({ error: "visitId is required" }, { status: 400 });
    }

    const session = sessions.get(visitId);
    if (!session) {
        return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json({ final: session.final, interim: session.interim });
}