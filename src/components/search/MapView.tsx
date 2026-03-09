"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Hospital {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    district: string;
    state: string;
    rating?: number;
}

interface MapViewProps {
    hospitals: Hospital[];
    userLocation: { lat: number; lng: number } | null;
    onHospitalClick?: (id: string) => void;
}

export default function MapView({ hospitals, userLocation, onHospitalClick }: MapViewProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }

        const center: [number, number] = userLocation
            ? [userLocation.lat, userLocation.lng]
            : [20.5937, 78.9629]; // India center

        const map = L.map(containerRef.current, {
            center,
            zoom: userLocation ? 11 : 5,
            scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        // User location marker
        if (userLocation) {
            const userIcon = L.divIcon({
                html: '<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 8px rgba(59,130,246,0.5);"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
                className: "",
            });
            L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
                .addTo(map)
                .bindPopup("Your Location");
        }

        // Hospital markers
        const hospitalIcon = L.divIcon({
            html: '<div style="width:12px;height:12px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6],
            className: "",
        });

        const bounds: [number, number][] = [];
        if (userLocation) bounds.push([userLocation.lat, userLocation.lng]);

        hospitals.forEach((h) => {
            if (!h.latitude || !h.longitude) return;
            bounds.push([h.latitude, h.longitude]);

            const marker = L.marker([h.latitude, h.longitude], { icon: hospitalIcon }).addTo(map);
            marker.bindPopup(
                `<div style="min-width:150px"><strong>${h.name}</strong><br/>${h.district}, ${h.state}${h.rating ? `<br/>★ ${h.rating.toFixed(1)}` : ""}<br/><a href="/hospital/${h.id}" style="color:#3b82f6">View Details →</a></div>`
            );
            if (onHospitalClick) {
                marker.on("click", () => onHospitalClick(h.id));
            }
        });

        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
        }

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [hospitals, userLocation, onHospitalClick]);

    return (
        <div
            ref={containerRef}
            className="w-full h-[400px] rounded-xl border border-base-200 overflow-hidden z-0"
        />
    );
}
