import { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const url = new URL(`${BACKEND}/api/insurance/check`);
        for (const [k, v] of sp.entries()) url.searchParams.set(k, v);

        const res = await fetch(url.toString());
        const data = await res.json();
        return Response.json(data, { status: res.status });
    } catch {
        return Response.json({ error: "Failed to check coverage" }, { status: 500 });
    }
}
