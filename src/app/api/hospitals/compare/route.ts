import { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const url = new URL(`${BACKEND}/api/hospitals/compare`);
        const ids = sp.get("ids");
        if (ids) url.searchParams.set("ids", ids);

        const res = await fetch(url.toString());
        const data = await res.json();
        return Response.json(data, { status: res.status });
    } catch {
        return Response.json({ error: "Failed to compare hospitals" }, { status: 500 });
    }
}
