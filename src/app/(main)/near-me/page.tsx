"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
    MapPin,
    Navigation,
    Loader2,
    AlertCircle,
    Phone,
    Clock,
    RefreshCw,
    ArrowRight,
    Filter,
    List,
    Map,
    Building2,
    Stethoscope,
    Pill,
    FlaskConical,
    Ambulance,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";

const NearMeMap = dynamic(() => import("./NearMeMap"), { ssr: false });

interface NearbyHospital {
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

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

function amenityToType(
    amenity: string | undefined,
    overrideType?: NearbyHospital["type"]
): NearbyHospital["type"] {
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

function buildAddress(tags: Record<string, string>): string {
    if (tags["addr:full"]) return tags["addr:full"];
    const parts = [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:suburb"],
        tags["addr:city"] || tags["addr:district"],
    ].filter(Boolean);
    return parts.join(", ");
}

function buildOverpassQuery(type: string, radiusM: number, lat: number, lon: number): string {
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

type OverpassElement = {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
};

async function fetchNearbyFromOSM(
    lat: number,
    lon: number,
    radiusKm: number,
    type: string
): Promise<NearbyHospital[]> {
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

const facilityTypes = [
    { id: "all", label: "All", icon: Building2 },
    { id: "hospital", label: "Hospitals", icon: Building2 },
    { id: "clinic", label: "Clinics", icon: Stethoscope },
    { id: "pharmacy", label: "Pharmacies", icon: Pill },
    { id: "lab", label: "Labs", icon: FlaskConical },
    { id: "emergency", label: "Emergency", icon: Ambulance },
];

export default function NearMePage() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState("all");
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [maxDistance, setMaxDistance] = useState(10);

    const fetchHospitals = useCallback(
        async (lat: number, lng: number) => {
            setIsFetching(true);
            setFetchError(null);
            try {
                const results = await fetchNearbyFromOSM(lat, lng, maxDistance, selectedType);
                setHospitals(results);
            } catch {
                setFetchError("Failed to load nearby facilities. Please try again.");
            } finally {
                setIsFetching(false);
            }
        },
        [maxDistance, selectedType]
    );

    useEffect(() => {
        if (location) {
            fetchHospitals(location.lat, location.lng);
        }
    }, [location, fetchHospitals]);

    const requestLocation = () => {
        setIsLoadingLocation(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            setIsLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setIsLoadingLocation(false);
            },
            (error) => {
                let message = "Unable to get your location";
                if (error.code === error.PERMISSION_DENIED) {
                    message = "Location permission denied. Please enable location access.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = "Location information unavailable";
                } else if (error.code === error.TIMEOUT) {
                    message = "Location request timed out";
                }
                setLocationError(message);
                setIsLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const getTypeIcon = (type: NearbyHospital["type"]) => {
        switch (type) {
            case "hospital": return <Building2 className="w-5 h-5" />;
            case "clinic": return <Stethoscope className="w-5 h-5" />;
            case "pharmacy": return <Pill className="w-5 h-5" />;
            case "lab": return <FlaskConical className="w-5 h-5" />;
            case "emergency": return <Ambulance className="w-5 h-5" />;
        }
    };

    const getTypeBadgeColor = (type: NearbyHospital["type"]) => {
        switch (type) {
            case "hospital": return "badge-primary";
            case "clinic": return "badge-secondary";
            case "pharmacy": return "badge-accent";
            case "lab": return "badge-info";
            case "emergency": return "badge-error";
        }
    };

    return (
        <div className="min-h-screen bg-base-200">
            <Breadcrumb />

            {/* Hero Section */}
            <section className="bg-linear-to-br from-accent/10 via-base-100 to-primary/10 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-6">
                            <MapPin className="w-5 h-5" />
                            <span className="font-medium">Location-Based Search</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Find Healthcare Near You
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            Discover hospitals, clinics, pharmacies, and labs in your vicinity.
                            Get directions and contact information instantly.
                        </p>

                        {!location && (
                            <button
                                className="btn btn-primary btn-lg gap-2"
                                onClick={requestLocation}
                                disabled={isLoadingLocation}
                            >
                                {isLoadingLocation ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Getting Location...
                                    </>
                                ) : (
                                    <>
                                        <Navigation className="w-5 h-5" />
                                        Enable Location
                                    </>
                                )}
                            </button>
                        )}

                        {locationError && (
                            <div className="alert alert-error max-w-md mx-auto mt-4">
                                <AlertCircle className="w-5 h-5" />
                                <span>{locationError}</span>
                            </div>
                        )}

                        {location && (
                            <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full">
                                <MapPin className="w-5 h-5" />
                                <span className="font-medium">Location enabled</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {location && (
                <div className="container mx-auto px-4 py-8">
                    {/* Filters */}
                    <div className="card bg-base-100 shadow-lg mb-6">
                        <div className="card-body">
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Facility Type Filter */}
                                <div className="flex flex-wrap gap-2">
                                    {facilityTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            className={`btn btn-sm gap-2 ${selectedType === type.id ? "btn-primary" : "btn-ghost"
                                                }`}
                                            onClick={() => setSelectedType(type.id)}
                                        >
                                            <type.icon className="w-4 h-4" />
                                            {type.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1"></div>

                                {/* Distance Filter */}
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-base-content/60" />
                                    <select
                                        className="select select-bordered select-sm"
                                        value={maxDistance}
                                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                                    >
                                        <option value={2}>Within 2 km</option>
                                        <option value={5}>Within 5 km</option>
                                        <option value={10}>Within 10 km</option>
                                        <option value={25}>Within 25 km</option>
                                    </select>
                                </div>

                                {/* View Toggle */}
                                <div className="btn-group">
                                    <button
                                        className={`btn btn-sm ${viewMode === "list" ? "btn-active" : ""}`}
                                        onClick={() => setViewMode("list")}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                    <button
                                        className={`btn btn-sm ${viewMode === "map" ? "btn-active" : ""}`}
                                        onClick={() => setViewMode("map")}
                                    >
                                        <Map className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fetch error */}
                    {fetchError && (
                        <div className="alert alert-error mb-4">
                            <AlertCircle className="w-5 h-5" />
                            <span>{fetchError}</span>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => fetchHospitals(location.lat, location.lng)}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Loading state */}
                    {isFetching && (
                        <div className="flex items-center gap-3 mb-4 text-base-content/60">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Searching for nearby facilities via OpenStreetMap…</span>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Results List */}
                        <div className={viewMode === "map" ? "lg:col-span-1" : "lg:col-span-3"}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">
                                    {hospitals.length} Places Found
                                </h2>
                            </div>

                            <div className={`space-y-4 ${viewMode === "list" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-4 space-y-0" : ""}`}>
                                {hospitals.map((hospital) => (
                                    <div key={hospital.id} className="card bg-base-100 shadow-lg">
                                        <div className="card-body">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-base-200">
                                                        {getTypeIcon(hospital.type)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold">{hospital.name}</h3>
                                                        <span className={`badge ${getTypeBadgeColor(hospital.type)} badge-sm`}>
                                                            {hospital.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-primary">
                                                        {hospital.distance} km
                                                    </div>
                                                    <div className="text-xs text-base-content/60">away</div>
                                                </div>
                                            </div>

                                            {hospital.address && (
                                                <p className="text-sm text-base-content/70 mt-2">
                                                    {hospital.address}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2 mt-3 text-sm">
                                                <Clock className="w-4 h-4 text-base-content/50 shrink-0" />
                                                <span className="text-base-content/70 text-xs">
                                                    {hospital.openingHours}
                                                </span>
                                            </div>

                                            <div className="card-actions justify-between mt-4 pt-3 border-t border-base-200">
                                                {hospital.phone ? (
                                                    <a
                                                        href={`tel:${hospital.phone}`}
                                                        className="btn btn-ghost btn-sm gap-1"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                        Call
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-base-content/40">No phone listed</span>
                                                )}
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-primary btn-sm gap-1"
                                                >
                                                    Directions
                                                    <ArrowRight className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {!isFetching && hospitals.length === 0 && (
                                    <div className="col-span-full card bg-base-100 shadow-lg">
                                        <div className="card-body items-center text-center py-12">
                                            <MapPin className="w-12 h-12 text-base-content/20 mb-4" />
                                            <h3 className="text-lg font-semibold">No places found</h3>
                                            <p className="text-base-content/60">
                                                Try adjusting your filters or increasing the search radius
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Map View */}
                        {viewMode === "map" && (
                            <div className="lg:col-span-2">
                                <div className="card bg-base-100 shadow-lg sticky top-24 overflow-hidden" style={{ height: "600px" }}>
                                    <NearMeMap
                                        userLat={location.lat}
                                        userLng={location.lng}
                                        hospitals={hospitals}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!location && !isLoadingLocation && !locationError && (
                <div className="container mx-auto px-4 py-16">
                    <div className="card bg-base-100 shadow-lg max-w-2xl mx-auto">
                        <div className="card-body items-center text-center py-12">
                            <MapPin className="w-16 h-16 text-base-content/20 mb-4" />
                            <h3 className="text-xl font-semibold">Enable Location Access</h3>
                            <p className="text-base-content/60 max-w-md">
                                To find healthcare facilities near you, we need access to your location.
                                Your location data is only used to show nearby results and is never stored.
                            </p>
                            <button
                                className="btn btn-primary mt-6"
                                onClick={requestLocation}
                            >
                                <Navigation className="w-5 h-5" />
                                Allow Location Access
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
