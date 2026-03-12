import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/bookmarks`, {
            headers: { cookie: req.headers.get("cookie") || "" },
        });
        const data = await res.json();
        return Response.json(data, { status: res.status });
    } catch {
        return Response.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await fetch(`${BACKEND_URL}/api/bookmarks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                cookie: req.headers.get("cookie") || "",
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return Response.json(data, { status: res.status });
    } catch {
        return Response.json({ error: "Failed to add bookmark" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { hospitalId } = await req.json();
        const res = await fetch(`${BACKEND_URL}/api/bookmarks/${hospitalId}`, {
            method: "DELETE",
            headers: { cookie: req.headers.get("cookie") || "" },
        });
        const data = await res.json();
        return Response.json(data, { status: res.status });
    } catch {
        return Response.json({ error: "Failed to remove bookmark" }, { status: 500 });
    }
}
