import { createAuthClient } from "better-auth/react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const authClient = createAuthClient({
    baseURL: BACKEND_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
