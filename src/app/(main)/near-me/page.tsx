"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { saveNearby, getNearby, getNearbyStale } from "@/lib/offlineDB";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
    type NearbyFacility,
    fetchNearbyFromOSM,
} from "@/lib/nearbyFacilities";
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
    WifiOff,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";

const NearMeMap = dynamic(() => import("./NearMeMap"), { ssr: false });

// NearbyHospital is an alias for the shared type
type NearbyHospital = NearbyFacility;

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
    const [hospitals, setHospitals] = useState<NearbyFacility[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState("all");
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [maxDistance, setMaxDistance] = useState(10);
    const [cachedAt, setCachedAt] = useState<number | null>(null);
    const isOnline = useOnlineStatus();
    const prevOnlineRef = useRef(true);

    const fetchHospitals = useCallback(
        async (lat: number, lng: number) => {
            setIsFetching(true);
            setFetchError(null);
            setCachedAt(null);

            // Offline or network unavailable: serve from IndexedDB immediately
            if (!navigator.onLine) {
                const cached = await getNearby<NearbyFacility>(lat, lng, selectedType, maxDistance)
                    ?? await getNearbyStale<NearbyFacility>(lat, lng, selectedType, maxDistance);
                if (cached) {
                    setHospitals(cached.hospitals);
                    setCachedAt(cached.savedAt);
                } else {
                    setHospitals([]);
                    setFetchError("You're offline and no cached data is available for this area yet. Connect to the internet once to enable offline support.");
                }
                setIsFetching(false);
                return;
            }

            try {
                const results = await fetchNearbyFromOSM(lat, lng, maxDistance, selectedType);
                setHospitals(results);
                saveNearby(lat, lng, selectedType, maxDistance, results);
            } catch {
                // Network failed mid-request — fall back to IndexedDB
                const stale = await getNearbyStale<NearbyFacility>(lat, lng, selectedType, maxDistance);
                if (stale) {
                    setHospitals(stale.hospitals);
                    setCachedAt(stale.savedAt);
                } else {
                    setFetchError("Failed to load nearby facilities. Please try again.");
                }
            } finally {
                setIsFetching(false);
            }
        },
        [maxDistance, selectedType]
    );

    // On mount: restore last known location from localStorage, then either
    // serve cache (offline) or kick off a fresh fetch (online).
    useEffect(() => {
        const stored = localStorage.getItem("medmap-last-location");
        if (stored) {
            try {
                const { lat, lng } = JSON.parse(stored) as { lat: number; lng: number };
                setLocation({ lat, lng });
                return; // fetchHospitals triggered by the location effect below
            } catch {
                localStorage.removeItem("medmap-last-location");
            }
        }

        // No stored location — silently try to get it if permission is already granted
        if (!navigator.permissions || !navigator.geolocation) return;
        navigator.permissions.query({ name: "geolocation" }).then((status) => {
            if (status.state !== "granted") return;
            setIsLoadingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    localStorage.setItem("medmap-last-location", JSON.stringify(coords));
                    setLocation(coords);
                    setIsLoadingLocation(false);
                },
                () => setIsLoadingLocation(false),
                { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
            );
        });
    }, []);

    useEffect(() => {
        if (location) fetchHospitals(location.lat, location.lng);
    }, [location, fetchHospitals]);

    // Auto-refetch when connection is restored while showing cached data
    useEffect(() => {
        if (isOnline && !prevOnlineRef.current && location && cachedAt !== null) {
            fetchHospitals(location.lat, location.lng);
        }
        prevOnlineRef.current = isOnline;
    }, [isOnline, location, cachedAt, fetchHospitals]);

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
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                localStorage.setItem("medmap-last-location", JSON.stringify(coords));
                setLocation(coords);
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
                                {cachedAt !== null && (
                                    <span className="badge badge-warning gap-1 text-xs">
                                        <WifiOff className="w-3 h-3" />
                                        Cached &middot; {cachedAt ? new Date(cachedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                    </span>
                                )}
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
