import { NextRequest } from "next/server";

const B = process.env.BACKEND_URL || "http://localhost:8000";
const fwd = (req: NextRequest) => ({ cookie: req.headers.get("cookie") || "" });
const safeJson = async (r: Response) => { const t = await r.text(); return t ? JSON.parse(t) : {}; };

export async function GET(req: NextRequest) {
    try {
        const res = await fetch(`${B}/api/registered-hospitals/mine`, { headers: fwd(req) });
        return Response.json(await safeJson(res), { status: res.status });
    } catch {
        return Response.json({ error: "Failed to fetch your hospitals" }, { status: 500 });
    }
}
