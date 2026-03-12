"use client";

import { useEffect, useRef, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineBanner() {
    const isOnline = useOnlineStatus();
    const [showBackOnline, setShowBackOnline] = useState(false);
    const prevRef = useRef(true);

    useEffect(() => {
        if (isOnline && !prevRef.current) {
            // Just came back online — flash the "back online" toast
            setShowBackOnline(true);
            const t = setTimeout(() => setShowBackOnline(false), 3000);
            return () => clearTimeout(t);
        }
        prevRef.current = isOnline;
    }, [isOnline]);

    if (!isOnline) {
        return (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
                <div className="flex items-center gap-2 bg-error text-error-content px-5 py-3 rounded-full shadow-xl font-medium text-sm">
                    <WifiOff className="w-4 h-4 shrink-0" />
                    You&apos;re offline &mdash; showing cached data where available
                </div>
            </div>
        );
    }

    if (showBackOnline) {
        return (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
                <div className="flex items-center gap-2 bg-success text-success-content px-5 py-3 rounded-full shadow-xl font-medium text-sm">
                    <Wifi className="w-4 h-4 shrink-0" />
                    Back online
                </div>
            </div>
        );
    }

    return null;
}
