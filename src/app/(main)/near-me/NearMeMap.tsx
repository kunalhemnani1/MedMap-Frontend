"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's broken default marker icons in webpack/Next.js bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Hospital {
    id: string;
    name: string;
    address: string;
    distance: number;
    type: string;
    openingHours: string;
    phone: string;
    lat: number;
    lon: number;
}

interface NearMeMapProps {
    userLat: number;
    userLng: number;
    hospitals: Hospital[];
}

const userIcon = L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(37,99,235,0.25)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

export default function NearMeMap({ userLat, userLng, hospitals }: NearMeMapProps) {
    return (
        <MapContainer
            center={[userLat, userLng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* User location marker */}
            <Marker position={[userLat, userLng]} icon={userIcon}>
                <Popup>Your location</Popup>
            </Marker>
            <Circle
                center={[userLat, userLng]}
                radius={300}
                pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.08, weight: 1 }}
            />

            {/* Hospital markers */}
            {hospitals.map((h) => (
                <Marker key={h.id} position={[h.lat, h.lon]}>
                    <Popup>
                        <div style={{ minWidth: 160 }}>
                            <strong>{h.name}</strong>
                            {h.address && <p style={{ margin: "4px 0", fontSize: 12 }}>{h.address}</p>}
                            <p style={{ margin: "2px 0", fontSize: 12 }}>{h.distance} km away</p>
                            <p style={{ margin: "2px 0", fontSize: 12 }}>{h.openingHours}</p>
                            {h.phone && (
                                <p style={{ margin: "2px 0", fontSize: 12 }}>
                                    <a href={`tel:${h.phone}`}>{h.phone}</a>
                                </p>
                            )}
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: 12, color: "#2563eb" }}
                            >
                                Get Directions ↗
                            </a>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
