import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
    try {
        const params = req.nextUrl.searchParams;

        // Forward all search params to the backend
        const backendUrl = new URL(`${BACKEND_URL}/api/search/hospitals`);
        params.forEach((value, key) => {
            // Map frontend param names to backend
            if (key === "query") {
                backendUrl.searchParams.set("q", value);
            } else {
                backendUrl.searchParams.set(key, value);
            }
        });

        const response = await fetch(backendUrl.toString(), {
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        console.error("Search proxy error:", error);
        return Response.json(
            { error: 1, message: "internal server error" },
            { status: 500 }
        );
    }
}
