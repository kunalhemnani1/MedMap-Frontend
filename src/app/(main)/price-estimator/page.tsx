"use client";

import { useState } from "react";
import {
    Calculator,
    IndianRupee,
    TrendingUp,
    TrendingDown,
    Building2,
    ChevronRight,
    Info,
    AlertCircle,
    CheckCircle,
    Plus,
    X,
    Loader2,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";

interface EstimateResult {
    avg_price: number;
    min_price: number;
    max_price: number;
    sample_count: number;
    by_hospital_type: { type: string; avg_price: number; count: number }[];
    cheapest_options: { hospital_name: string; hospital_id: number; price: number; city: string; state: string }[];
}

export default function PriceEstimatorPage() {
    const [procedure, setProcedure] = useState("");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [estimate, setEstimate] = useState<EstimateResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGetEstimates = async () => {
        if (!procedure.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ procedure: procedure.trim() });
            if (state) params.set("state", state);
            if (city) params.set("city", city);
            const res = await fetch(`/api/pricing/estimate?${params}`);
            if (!res.ok) throw new Error("Failed to get estimate");
            const json = await res.json();
            setEstimate(json);
        } catch {
            setError("Could not fetch estimates. Try a different procedure name.");
            setEstimate(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200">
            <Breadcrumb />

            {/* Hero Section */}
            <section className="bg-linear-to-br from-secondary/10 via-base-100 to-primary/10 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-6">
                            <Calculator className="w-5 h-5" />
                            <span className="font-medium">Price Estimator</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Estimate Your Medical Costs
                        </h1>
                        <p className="text-lg text-base-content/70">
                            Get instant cost estimates for medical procedures across hospitals.
                            Compare prices and find the best value for your healthcare needs.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Input Section */}
                    <div className="lg:col-span-1">
                        <div className="card bg-base-100 shadow-lg sticky top-24">
                            <div className="card-body">
                                <h2 className="card-title mb-4">
                                    <IndianRupee className="w-5 h-5 text-primary" />
                                    Estimate Costs
                                </h2>

                                <div className="form-control mb-3">
                                    <label className="label">
                                        <span className="label-text font-medium">Procedure Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., MRI Scan, Knee Replacement..."
                                        className="input input-bordered w-full"
                                        value={procedure}
                                        onChange={(e) => setProcedure(e.target.value)}
                                    />
                                </div>

                                <div className="form-control mb-3">
                                    <label className="label">
                                        <span className="label-text font-medium">State (Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Maharashtra"
                                        className="input input-bordered w-full"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                    />
                                </div>

                                <div className="form-control mb-4">
                                    <label className="label">
                                        <span className="label-text font-medium">City (Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Mumbai"
                                        className="input input-bordered w-full"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                </div>

                                {error && (
                                    <div className="alert alert-error mb-4">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <button
                                    className="btn btn-primary w-full"
                                    disabled={!procedure.trim() || isLoading}
                                    onClick={handleGetEstimates}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Getting Estimates...
                                        </>
                                    ) : (
                                        <>
                                            Get Price Estimate
                                            <ChevronRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {!estimate && !isLoading && !error && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body items-center text-center py-16">
                                    <Calculator className="w-16 h-16 text-base-content/20 mb-4" />
                                    <h3 className="text-xl font-semibold">Enter a Procedure Name</h3>
                                    <p className="text-base-content/60 max-w-md">
                                        Type a procedure name and optionally a location to get price estimates
                                        across hospitals in India.
                                    </p>
                                </div>
                            </div>
                        )}

                        {estimate && (
                            <>
                                {/* Summary Cards */}
                                <div className="grid sm:grid-cols-3 gap-4">
                                    <div className="card bg-base-100 shadow">
                                        <div className="card-body p-4 text-center">
                                            <div className="text-sm text-base-content/60">Average Price</div>
                                            <div className="text-2xl font-bold text-primary">
                                                ₹{Math.round(estimate.avg_price).toLocaleString("en-IN")}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card bg-base-100 shadow">
                                        <div className="card-body p-4 text-center">
                                            <div className="text-sm text-base-content/60">Lowest Price</div>
                                            <div className="text-2xl font-bold text-success">
                                                ₹{estimate.min_price.toLocaleString("en-IN")}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card bg-base-100 shadow">
                                        <div className="card-body p-4 text-center">
                                            <div className="text-sm text-base-content/60">Highest Price</div>
                                            <div className="text-2xl font-bold text-error">
                                                ₹{estimate.max_price.toLocaleString("en-IN")}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* By Hospital Type */}
                                {estimate.by_hospital_type?.length > 0 && (
                                    <div className="card bg-base-100 shadow-lg">
                                        <div className="card-body">
                                            <h2 className="card-title mb-4">
                                                <TrendingUp className="w-5 h-5 text-primary" />
                                                Price by Hospital Type
                                            </h2>
                                            <div className="space-y-3">
                                                {estimate.by_hospital_type.map((ht, i) => (
                                                    <div key={i} className="flex items-center justify-between bg-base-200 rounded-lg p-3">
                                                        <div>
                                                            <div className="font-medium">{ht.type}</div>
                                                            <div className="text-sm text-base-content/60">{ht.count} hospitals</div>
                                                        </div>
                                                        <div className="font-semibold text-primary">
                                                            ₹{Math.round(ht.avg_price).toLocaleString("en-IN")}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Cheapest Options */}
                                {estimate.cheapest_options?.length > 0 && (
                                    <div className="card bg-base-100 shadow-lg">
                                        <div className="card-body">
                                            <h2 className="card-title mb-4">
                                                <Building2 className="w-5 h-5 text-primary" />
                                                Most Affordable Options
                                            </h2>
                                            <div className="overflow-x-auto">
                                                <table className="table">
                                                    <thead>
                                                        <tr>
                                                            <th>Hospital</th>
                                                            <th>Location</th>
                                                            <th className="text-right">Price</th>
                                                            <th className="text-right">Savings</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {estimate.cheapest_options.map((h, i) => {
                                                            const savings = Math.round(estimate.avg_price) - h.price;
                                                            return (
                                                                <tr key={i} className={i === 0 ? "bg-success/10" : ""}>
                                                                    <td>
                                                                        <div className="flex items-center gap-2">
                                                                            {i === 0 && <span className="badge badge-success badge-sm">Best</span>}
                                                                            <span className="font-medium">{h.hospital_name}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-base-content/60">{h.city}, {h.state}</td>
                                                                    <td className="text-right font-semibold">₹{h.price.toLocaleString("en-IN")}</td>
                                                                    <td className="text-right">
                                                                        {savings > 0 ? (
                                                                            <span className="text-success flex items-center justify-end gap-1">
                                                                                <TrendingDown className="w-4 h-4" />
                                                                                ₹{savings.toLocaleString("en-IN")}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-base-content/40">-</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="alert">
                                    <Info className="w-5 h-5" />
                                    <span className="text-sm">
                                        Prices are estimates based on {estimate.sample_count} data points. Actual prices may vary
                                        based on your specific condition and requirements.
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
