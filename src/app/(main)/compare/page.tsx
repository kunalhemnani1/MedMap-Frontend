"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Star,
  MapPin,
  Clock,
  BadgeCheck,
  Plus,
  X,
  Check,
  Building2,
  Loader2,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";

interface CompareHospital {
  id: string;
  name: string;
  state: string;
  district: string;
  pincode: number;
  telephone: string;
  avg_price: number;
  procedure_count: number;
  avg_rating: number;
  review_count: number;
}

const COMPARE_FEATURES: { key: string; label: string; format: (v: unknown) => string }[] = [
  { key: "avg_price", label: "Avg Procedure Price", format: (v) => v ? `₹${Math.round(v as number).toLocaleString("en-IN")}` : "N/A" },
  { key: "avg_rating", label: "Rating", format: (v) => v ? `${(v as number).toFixed(1)} ★` : "N/A" },
  { key: "review_count", label: "Reviews", format: (v) => String(v || 0) },
  { key: "district", label: "District", format: (v) => String(v || "") },
  { key: "state", label: "State", format: (v) => String(v || "") },
  { key: "telephone", label: "Phone", format: (v) => String(v || "N/A") },
];

function ComparePageContent() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") || "";

  const [inputIds, setInputIds] = useState(idsParam);
  const [hospitals, setHospitals] = useState<CompareHospital[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCompare = async (ids: string) => {
    if (!ids.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hospitals/compare?ids=${ids}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setHospitals(json.hospitals || []);
    } catch {
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idsParam) fetchCompare(idsParam);
  }, [idsParam]);

  const handleCompare = () => {
    fetchCompare(inputIds);
  };

  const removeHospital = (id: string) => {
    setHospitals(hospitals.filter((h) => h.id !== id));
  };

  const getValue = (h: CompareHospital, key: string): unknown => {
    return (h as unknown as Record<string, unknown>)[key];
  };

  const getBestValue = (key: string) => {
    if (hospitals.length === 0) return null;
    if (key === "avg_price") {
      const valid = hospitals.filter((h) => h.avg_price > 0);
      if (valid.length === 0) return null;
      return valid.reduce((best, h) => h.avg_price < best.avg_price ? h : best).id;
    } else if (key === "avg_rating") {
      return hospitals.reduce((best, h) =>
        (h.avg_rating || 0) > (best.avg_rating || 0) ? h : best
      ).id;
    } else if (key === "review_count") {
      return hospitals.reduce((best, h) =>
        (h.review_count || 0) > (best.review_count || 0) ? h : best
      ).id;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-base-100">
      <Breadcrumb items={[{ label: "Compare Hospitals", href: "/compare" }]} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Compare Hospitals</h1>
            <p className="text-base-content/60">
              Enter hospital IDs separated by commas to compare
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., HOSP00001,HOSP00002"
              className="input input-bordered input-sm w-48"
              value={inputIds}
              onChange={(e) => setInputIds(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={handleCompare} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Compare"}
            </button>
          </div>
        </div>

        {hospitals.length === 0 && !loading ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No hospitals to compare</h2>
            <p className="text-base-content/60 mb-4">
              Enter hospital IDs above or search for hospitals first
            </p>
            <Link href="/search" className="btn btn-primary">
              Search Hospitals
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        ) : (
          <>
            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="table table-lg">
                <thead>
                  <tr>
                    <th className="w-48"></th>
                    {hospitals.map((hospital) => (
                      <th key={hospital.id} className="text-center min-w-[200px]">
                        <div className="relative">
                          <button
                            className="btn btn-ghost btn-circle btn-xs absolute -top-2 -right-2"
                            onClick={() => removeHospital(hospital.id)}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="h-24 w-24 bg-base-200 rounded-xl mx-auto mb-3 flex items-center justify-center">
                            <Building2 className="w-10 h-10 text-base-content/30" />
                          </div>
                          <div className="font-semibold text-base">
                            {hospital.name}
                          </div>
                          <div className="text-sm text-base-content/60 flex items-center justify-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {hospital.district}, {hospital.state}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_FEATURES.map((feature) => {
                    const bestId = getBestValue(feature.key);
                    return (
                      <tr key={feature.key} className="hover">
                        <td className="font-medium">{feature.label}</td>
                        {hospitals.map((hospital) => {
                          const value = getValue(hospital, feature.key);
                          const isBest = hospital.id === bestId;
                          return (
                            <td key={hospital.id} className="text-center">
                              <span
                                className={`inline-flex items-center gap-1 ${isBest ? "text-success font-semibold" : ""
                                  }`}
                              >
                                {feature.format(value)}
                                {isBest && <Check className="w-4 h-4" />}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Action row */}
                  <tr>
                    <td></td>
                    {hospitals.map((hospital) => (
                      <td key={hospital.id} className="text-center">
                        <Link
                          href={`/hospital/${hospital.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Recommendation */}
            {hospitals.length >= 2 && (
              <div className="card bg-success/10 border border-success/20 mt-8">
                <div className="card-body">
                  <h3 className="card-title text-success">
                    <Check className="w-5 h-5" />
                    Best Value
                  </h3>
                  <p className="text-base-content/70">
                    Based on average procedure pricing,{" "}
                    <strong>
                      {hospitals.find((h) => h.id === getBestValue("avg_price"))?.name || "N/A"}
                    </strong>{" "}
                    offers the best value.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}
