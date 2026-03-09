import Link from "next/link";
import { Star, Heart, MapPin, Clock, BadgeCheck, Building2 } from "lucide-react";

interface HospitalCardProps {
    id: string | number;
    name: string;
    address: string;
    district: string;
    state: string;
    pincode?: number;
    rating?: number;
    reviewCount?: number;
    priceFrom?: number;
    distance?: number;
    isOpen?: boolean;
    accreditation?: string[];
    imageUrl?: string;
    onSave?: () => void;
    onCompare?: () => void;
    isSaved?: boolean;
}

export default function HospitalCard({
    id,
    name,
    address,
    district,
    state,
    pincode,
    rating = 4.0,
    reviewCount = 0,
    priceFrom,
    distance,
    isOpen = true,
    accreditation = [],
    imageUrl,
    onSave,
    onCompare,
    isSaved = false,
}: HospitalCardProps) {
    return (
        <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
            {/* Image */}
            <figure className="relative h-40 bg-base-200 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                    <Building2 className="w-16 h-16 text-base-content/20" />
                </div>
                {/* Save button */}
                <button
                    onClick={onSave}
                    className={`absolute top-3 right-3 btn btn-circle btn-sm ${isSaved ? "btn-primary" : "btn-ghost bg-base-100/80 hover:bg-base-100"
                        }`}
                    aria-label={isSaved ? "Unsave" : "Save"}
                >
                    <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                </button>
            </figure>

            <div className="card-body p-4">
                {/* Rating */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-warning fill-warning" />
                        <span className="font-medium">{rating.toFixed(1)}</span>
                        <span className="text-base-content/50">({reviewCount} reviews)</span>
                    </div>
                </div>

                {/* Name */}
                <h3 className="card-title text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {name}
                </h3>

                {/* Address */}
                <p className="text-sm text-base-content/70 line-clamp-1">{address}</p>
                <p className="text-sm text-base-content/50">
                    {district}, {state} {pincode && `- ${pincode}`}
                </p>

                {/* Price */}
                {priceFrom && (
                    <p className="text-sm font-medium text-primary">
                        Starts from ₹{priceFrom.toLocaleString("en-IN")}
                    </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                    {accreditation.slice(0, 2).map((acc) => (
                        <span key={acc} className="badge badge-outline badge-sm gap-1">
                            <BadgeCheck className="w-3 h-3" />
                            {acc}
                        </span>
                    ))}
                    {isOpen && (
                        <span className="badge badge-success badge-sm gap-1">
                            <Clock className="w-3 h-3" />
                            Open
                        </span>
                    )}
                    {distance && (
                        <span className="badge badge-ghost badge-sm gap-1">
                            <MapPin className="w-3 h-3" />
                            {distance} km
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="card-actions mt-4 pt-3 border-t border-base-200">
                    <Link href={`/hospital/${id}`} className="btn btn-primary btn-sm flex-1">
                        View Details
                    </Link>
                    <button onClick={onCompare} className="btn btn-outline btn-sm">
                        Compare
                    </button>
                </div>
            </div>
        </div>
    );
}
