import { NextRequest } from "next/server";

const B = process.env.BACKEND_URL || "http://localhost:8000";
const fwd = (req: NextRequest) => ({ cookie: req.headers.get("cookie") || "" });
const safeJson = async (r: Response) => { const t = await r.text(); return t ? JSON.parse(t) : {}; };

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; priceId: string }> }) {
    try {
        const { id, priceId } = await params;
        const res = await fetch(`${B}/api/registered-hospitals/${id}/prices/${priceId}`, {
            method: "DELETE",
            headers: fwd(req),
        });
        return Response.json(await safeJson(res), { status: res.status });
    } catch {
        return Response.json({ error: "Failed to remove price" }, { status: 500 });
    }
}
