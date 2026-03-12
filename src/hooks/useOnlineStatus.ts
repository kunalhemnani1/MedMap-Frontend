"use client";

import { useEffect, useState } from "react";

/** Returns true if the browser currently has a network connection. */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(true); // default true to avoid SSR flicker

    useEffect(() => {
        // Sync with real browser value on mount
        setIsOnline(navigator.onLine);

        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);

        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
    }, []);

    return isOnline;
}
