"use client";

/**
 * BackgroundNearbyCache
 *
 * Runs silently on every page load. If the user has already granted geolocation
 * permission (no prompt shown), fetches nearby facilities for their current
 * position and saves the results to IndexedDB so the /near-me page works offline.
 *
 * - Only runs once per browser session (sessionStorage flag) to avoid hammering
 *   Overpass API on every navigation.
 * - Skips if offline.
 * - Completely invisible — renders nothing.
 */

import { useEffect } from "react";
import { saveNearby, getNearby } from "@/lib/offlineDB";
import { fetchNearbyFromOSM, type NearbyFacility } from "@/lib/nearbyFacilities";

// Cache these types on background load (covers all /near-me filter tabs)
const BACKGROUND_TYPES = ["all", "hospital", "emergency"] as const;
const BACKGROUND_RADIUS_KM = 10;
// Refresh cache if it's older than 6 hours
const REFRESH_AFTER_MS = 6 * 60 * 60 * 1000;

export default function BackgroundNearbyCache() {
    useEffect(() => {
        // Only run once per browser session
        if (sessionStorage.getItem("medmap-bg-cache-done")) return;

        // Skip if offline
        if (!navigator.onLine) return;

        // Only proceed if geolocation permission is already granted — never prompt
        if (!navigator.permissions) return;

        navigator.permissions.query({ name: "geolocation" }).then(async (status) => {
            if (status.state !== "granted") return;

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    sessionStorage.setItem("medmap-bg-cache-done", "1");
                    const { latitude: lat, longitude: lng } = pos.coords;

                    // Fetch each type in sequence to avoid rate-limiting Overpass
                    for (const type of BACKGROUND_TYPES) {
                        // Skip if we have a fresh cache entry
                        const existing = await getNearby<NearbyFacility>(lat, lng, type, BACKGROUND_RADIUS_KM);
                        if (existing && Date.now() - existing.savedAt < REFRESH_AFTER_MS) continue;

                        try {
                            const results = await fetchNearbyFromOSM(lat, lng, BACKGROUND_RADIUS_KM, type);
                            await saveNearby(lat, lng, type, BACKGROUND_RADIUS_KM, results);
                            // Small gap between requests to be polite to the free API
                            await new Promise<void>((r) => setTimeout(r, 800));
                        } catch {
                            // Best-effort — never surface errors to the user
                            break;
                        }
                    }
                },
                () => { /* Permission revoked or unavailable — ignore */ },
                { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
            );
        });
    }, []);

    return null;
}
