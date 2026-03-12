import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
    try {
        const params = req.nextUrl.searchParams.toString();
        const res = await fetch(`${BACKEND_URL}/api/bookings?${params}`, {
            headers: { cookie: req.headers.get("cookie") || "" },
        });
        const data = await res.json();
        return Response.json(data, { status: res.status });
    } catch {
        return Response.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}
