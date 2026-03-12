import { NextRequest } from "next/server";

const B = process.env.BACKEND_URL || "http://localhost:8000";
const fwd = (req: NextRequest) => ({ cookie: req.headers.get("cookie") || "" });
const safeJson = async (r: Response) => { const t = await r.text(); return t ? JSON.parse(t) : {}; };

export async function GET(req: NextRequest) {
    try {
        const params = req.nextUrl.searchParams.toString();
        const res = await fetch(`${B}/api/registered-hospitals?${params}`, { headers: fwd(req) });
        return Response.json(await safeJson(res), { status: res.status });
    } catch {
        return Response.json({ error: "Failed to fetch hospitals" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await fetch(`${B}/api/registered-hospitals`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...fwd(req) },
            body: JSON.stringify(body),
        });
        return Response.json(await safeJson(res), { status: res.status });
    } catch {
        return Response.json({ error: "Failed to register hospital" }, { status: 500 });
    }
}
