export interface NearbyFacility {
    id: string;
    name: string;
    address: string;
    distance: number;
    type: "hospital" | "clinic" | "pharmacy" | "lab" | "emergency";
    openingHours: string;
    phone: string;
    lat: number;
    lon: number;
}

type OverpassElement = {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
};

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

export function amenityToType(
    amenity: string | undefined,
    overrideType?: NearbyFacility["type"]
): NearbyFacility["type"] {
    if (overrideType) return overrideType;
    switch (amenity) {
        case "hospital": return "hospital";
        case "clinic":
        case "doctors": return "clinic";
        case "pharmacy": return "pharmacy";
        case "laboratory": return "lab";
        default: return "hospital";
    }
}

export function buildAddress(tags: Record<string, string>): string {
    if (tags["addr:full"]) return tags["addr:full"];
    const parts = [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:suburb"],
        tags["addr:city"] || tags["addr:district"],
    ].filter(Boolean);
    return parts.join(", ");
}

export function buildOverpassQuery(type: string, radiusM: number, lat: number, lon: number): string {
    const around = `around:${radiusM},${lat},${lon}`;
    let body: string;
    if (type === "all") {
        body = `(node["amenity"~"^(hospital|clinic|pharmacy|laboratory|doctors)$"](${around});way["amenity"~"^(hospital|clinic|pharmacy|laboratory|doctors)$"](${around}););`;
    } else if (type === "emergency") {
        body = `(node["amenity"="hospital"]["emergency"="yes"](${around});node["emergency"~"yes|ambulance_station"](${around}););`;
    } else if (type === "lab") {
        body = `(node["amenity"="laboratory"](${around});node["healthcare"~"^(laboratory|diagnostics)$"](${around});way["amenity"="laboratory"](${around}););`;
    } else if (type === "clinic") {
        body = `(node["amenity"~"^(clinic|doctors)$"](${around});way["amenity"~"^(clinic|doctors)$"](${around}););`;
    } else {
        body = `(node["amenity"="${type}"](${around});way["amenity"="${type}"](${around}););`;
    }
    return `[out:json][timeout:20];${body}out center body;`;
}

export async function fetchNearbyFromOSM(
    lat: number,
    lon: number,
    radiusKm: number,
    type: string
): Promise<NearbyFacility[]> {
    const query = buildOverpassQuery(type, radiusKm * 1000, lat, lon);
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
    const data: { elements: OverpassElement[] } = await res.json();

    const overrideType = type === "emergency" ? ("emergency" as const) : undefined;

    return data.elements
        .filter((el) => el.tags?.name)
        .map((el) => {
            const elLat = el.lat ?? el.center?.lat ?? 0;
            const elLon = el.lon ?? el.center?.lon ?? 0;
            const tags = el.tags ?? {};
            return {
                id: `${el.type}-${el.id}`,
                name: tags.name,
                address: buildAddress(tags),
                distance: haversine(lat, lon, elLat, elLon),
                type: amenityToType(tags.amenity, overrideType),
                openingHours: tags.opening_hours || "Hours not available",
                phone: tags.phone || tags["contact:phone"] || tags["contact:mobile"] || "",
                lat: elLat,
                lon: elLon,
            };
        })
        .sort((a, b) => a.distance - b.distance);
}
