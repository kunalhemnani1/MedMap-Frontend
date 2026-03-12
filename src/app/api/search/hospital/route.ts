import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
    try {
        const params = req.nextUrl.searchParams;
        const backendUrl = new URL(`${BACKEND_URL}/api/search/hospitals`);

        // Map legacy `value` param to `q`
        params.forEach((value, key) => {
            backendUrl.searchParams.set(key === "value" ? "q" : key, value);
        });

        const response = await fetch(backendUrl.toString());
        const data = await response.json();
        return Response.json(data, { status: response.status });
    } catch (err) {
        console.error(err);
        return Response.json({ error: 1, message: "internal server error" }, { status: 500 });
    }
}