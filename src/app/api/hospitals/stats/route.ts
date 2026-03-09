import { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
    try {
        const res = await fetch(`${BACKEND}/api/hospitals/stats`);
        const data = await res.json();
        return Response.json(data, { status: res.status });
    } catch {
        return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
