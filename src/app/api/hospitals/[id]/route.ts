import { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const res = await fetch(`${BACKEND}/api/hospitals/${id}`);
        const data = await res.json();
        return Response.json(data, { status: res.status });
    } catch {
        return Response.json({ error: "Failed to fetch hospital" }, { status: 500 });
    }
}
