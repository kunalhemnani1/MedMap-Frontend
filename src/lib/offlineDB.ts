/**
 * MedMap offline IndexedDB store.
 * Generic key→value cache with per-entry TTL.
 * Used to persist nearby-hospital search results across sessions.
 */

const DB_NAME = "medmap-offline";
const DB_VERSION = 1;
const NEARBY_STORE = "nearby";

/** 24-hour TTL for cached search results */
const NEARBY_TTL_MS = 24 * 60 * 60 * 1000;

// Singleton DB promise – opens once, reuses across calls
let _dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
    if (!_dbPromise) {
        _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(NEARBY_STORE)) {
                    const store = db.createObjectStore(NEARBY_STORE, { keyPath: "key" });
                    store.createIndex("savedAt", "savedAt");
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => {
                _dbPromise = null; // allow retry
                reject(req.error);
            };
        });
    }
    return _dbPromise;
}

/**
 * Build a deterministic cache key.
 * Rounds lat/lng to 2 dp (~1 km grid) so nearby queries share the cache.
 */
export function nearbyKey(lat: number, lng: number, type: string, radiusKm: number): string {
    return `${lat.toFixed(2)}_${lng.toFixed(2)}_${type}_${radiusKm}`;
}

/** Persist a list of nearby hospitals to IndexedDB. */
export async function saveNearby<T>(
    lat: number,
    lng: number,
    type: string,
    radiusKm: number,
    hospitals: T[]
): Promise<void> {
    try {
        const db = await getDB();
        const key = nearbyKey(lat, lng, type, radiusKm);
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(NEARBY_STORE, "readwrite");
            tx.objectStore(NEARBY_STORE).put({ key, hospitals, savedAt: Date.now() });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch {
        // Best-effort – never block the UI
    }
}

/** Retrieve cached nearby hospitals. Returns null if missing or expired. */
export async function getNearby<T>(
    lat: number,
    lng: number,
    type: string,
    radiusKm: number
): Promise<{ hospitals: T[]; savedAt: number } | null> {
    try {
        const db = await getDB();
        const key = nearbyKey(lat, lng, type, radiusKm);
        const result = await new Promise<{ key: string; hospitals: T[]; savedAt: number } | undefined>(
            (resolve, reject) => {
                const tx = db.transaction(NEARBY_STORE, "readonly");
                const req = tx.objectStore(NEARBY_STORE).get(key);
                req.onsuccess = () => resolve(req.result as typeof result);
                req.onerror = () => reject(req.error);
            }
        );
        if (!result) return null;
        if (Date.now() - result.savedAt > NEARBY_TTL_MS) return null; // stale
        return { hospitals: result.hospitals, savedAt: result.savedAt };
    } catch {
        return null;
    }
}

/** Return the most-recent cached entry regardless of TTL (used as last-resort fallback). */
export async function getNearbyStale<T>(
    lat: number,
    lng: number,
    type: string,
    radiusKm: number
): Promise<{ hospitals: T[]; savedAt: number } | null> {
    try {
        const db = await getDB();
        const key = nearbyKey(lat, lng, type, radiusKm);
        const result = await new Promise<{ key: string; hospitals: T[]; savedAt: number } | undefined>(
            (resolve, reject) => {
                const tx = db.transaction(NEARBY_STORE, "readonly");
                const req = tx.objectStore(NEARBY_STORE).get(key);
                req.onsuccess = () => resolve(req.result as typeof result);
                req.onerror = () => reject(req.error);
            }
        );
        if (!result) return null;
        return { hospitals: result.hospitals, savedAt: result.savedAt };
    } catch {
        return null;
    }
}
