"use client";

import { useState, useEffect } from "react";
import {
    Shield,
    Search,
    CheckCircle,
    XCircle,
    AlertCircle,
    Building2,
    FileText,
    Phone,
    ArrowRight,
    Loader2,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";

interface InsurancePlan {
    id: string;
    provider: string;
    plan_name: string;
    plan_type: string;
    sum_insured: number;
    annual_premium: number;
    co_payment: number;
    deductible: number;
    maternity_covered: boolean;
    [key: string]: unknown;
}

interface MatchingPlan {
    id: string;
    provider: string;
    plan_name: string;
    sum_insured: number;
    annual_premium: number;
    co_payment: number;
    out_of_pocket: number;
    claim_settlement_ratio: number;
}

interface CoverageResult {
    procedure: string;
    estimated_cost: number;
    price_range: { min: number; max: number };
    matching_plans: MatchingPlan[];
}

export default function InsuranceCheckerPage() {
    const [procedure, setProcedure] = useState("");
    const [planType, setPlanType] = useState("");
    const [maxPremium, setMaxPremium] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<CoverageResult | null>(null);
    const [plans, setPlans] = useState<InsurancePlan[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Load available plan types
    const planTypes = ["Individual", "Family", "Senior Citizen", "Group", "Top-Up"];

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!procedure.trim()) {
            setError("Please enter a procedure name");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ procedure: procedure.trim() });
            const res = await fetch(`/api/insurance/check?${params}`);
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            setResults(json);
        } catch {
            setError("Could not check coverage. Try a different procedure.");
            setResults(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBrowsePlans = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (planType) params.set("type", planType);
            if (maxPremium) params.set("max_premium", maxPremium);
            const res = await fetch(`/api/insurance/plans?${params}`);
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            setPlans(json.results || []);
        } catch {
            setPlans([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200">
            <Breadcrumb />

            {/* Hero Section */}
            <section className="bg-linear-to-br from-primary/10 via-base-100 to-secondary/10 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">Insurance Coverage Checker</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Check Your Insurance Coverage
                        </h1>
                        <p className="text-lg text-base-content/70">
                            Verify which insurance plans cover your procedure and understand
                            estimated out-of-pocket costs.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <div className="card bg-base-100 shadow-lg sticky top-24">
                            <div className="card-body">
                                <h2 className="card-title mb-4">
                                    <FileText className="w-5 h-5 text-primary" />
                                    Coverage Check
                                </h2>

                                <form onSubmit={handleCheck} className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Procedure Name</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., MRI Scan, Knee Replacement"
                                            className="input input-bordered w-full"
                                            value={procedure}
                                            onChange={(e) => setProcedure(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Plan Type (Optional)</span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full"
                                            value={planType}
                                            onChange={(e) => setPlanType(e.target.value)}
                                        >
                                            <option value="">All types</option>
                                            {planTypes.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Max Annual Premium</span>
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="e.g., 50000"
                                            className="input input-bordered w-full"
                                            value={maxPremium}
                                            onChange={(e) => setMaxPremium(e.target.value)}
                                        />
                                    </div>

                                    {error && (
                                        <div className="alert alert-error">
                                            <AlertCircle className="w-5 h-5" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-full"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Checking...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-5 h-5" />
                                                Check Coverage
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="divider">Or</div>

                                <button
                                    onClick={handleBrowsePlans}
                                    className="btn btn-outline btn-sm gap-2"
                                    disabled={isLoading}
                                >
                                    <Shield className="w-4 h-4" />
                                    Browse Insurance Plans
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2">
                        {!results && plans.length === 0 && !isLoading && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body items-center text-center py-16">
                                    <Shield className="w-16 h-16 text-base-content/20 mb-4" />
                                    <h3 className="text-xl font-semibold">Enter a Procedure Name</h3>
                                    <p className="text-base-content/60 max-w-md">
                                        Enter a procedure to see which insurance plans cover it, along
                                        with estimated out-of-pocket costs.
                                    </p>
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body items-center text-center py-16">
                                    <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                                    <h3 className="text-xl font-semibold">Checking Coverage...</h3>
                                </div>
                            </div>
                        )}

                        {results && !isLoading && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">
                                        Coverage for &ldquo;{results.procedure}&rdquo;
                                    </h2>
                                    <span className="badge badge-lg">
                                        Avg cost: ₹{Math.round(results.estimated_cost).toLocaleString("en-IN")}
                                    </span>
                                </div>

                                {results.matching_plans.length === 0 ? (
                                    <div className="card bg-base-100 shadow-lg">
                                        <div className="card-body text-center py-8">
                                            <XCircle className="w-12 h-12 text-error mx-auto mb-2" />
                                            <p className="text-base-content/60">No matching plans found for this procedure.</p>
                                        </div>
                                    </div>
                                ) : (
                                    results.matching_plans.map((mp, index) => {
                                        const coveragePct = mp.co_payment > 0 ? 100 - mp.co_payment : 100;
                                        return (
                                            <div
                                                key={index}
                                                className={`card bg-base-100 shadow-lg border-l-4 ${coveragePct >= 80
                                                        ? "border-success"
                                                        : coveragePct >= 50
                                                            ? "border-warning"
                                                            : "border-error"
                                                    }`}
                                            >
                                                <div className="card-body">
                                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Shield className="w-5 h-5 text-primary" />
                                                                <h3 className="font-semibold text-lg">{mp.plan_name}</h3>
                                                            </div>
                                                            <p className="text-sm text-base-content/60">{mp.provider}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-3xl font-bold text-primary">
                                                                {coveragePct}%
                                                            </div>
                                                            <div className="text-sm text-base-content/60">Coverage</div>
                                                        </div>
                                                    </div>

                                                    <div className="grid sm:grid-cols-3 gap-4 mt-4">
                                                        <div className="bg-base-200 rounded-lg p-3">
                                                            <div className="text-sm text-base-content/60">Out-of-Pocket</div>
                                                            <div className="font-semibold">₹{Math.round(mp.out_of_pocket).toLocaleString("en-IN")}</div>
                                                        </div>
                                                        <div className="bg-base-200 rounded-lg p-3">
                                                            <div className="text-sm text-base-content/60">Annual Premium</div>
                                                            <div className="font-semibold">₹{mp.annual_premium.toLocaleString("en-IN")}</div>
                                                        </div>
                                                        <div className="bg-base-200 rounded-lg p-3">
                                                            <div className="text-sm text-base-content/60">Sum Insured</div>
                                                            <div className="font-semibold">₹{mp.sum_insured.toLocaleString("en-IN")}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                <div className="alert alert-info">
                                    <AlertCircle className="w-5 h-5" />
                                    <div>
                                        <h4 className="font-semibold">Disclaimer</h4>
                                        <p className="text-sm">
                                            Coverage estimates are approximate. Please contact your insurance
                                            provider for exact coverage details.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Browse Plans Results */}
                        {plans.length > 0 && !results && !isLoading && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold">{plans.length} Insurance Plans</h2>
                                {plans.map((plan, i) => (
                                    <div key={i} className="card bg-base-100 shadow-lg">
                                        <div className="card-body">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{plan.plan_name}</h3>
                                                    <p className="text-sm text-base-content/60">{plan.provider}</p>
                                                    <span className="badge badge-outline badge-sm mt-1">{plan.plan_type}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-primary">
                                                        ₹{plan.annual_premium.toLocaleString("en-IN")}
                                                    </div>
                                                    <div className="text-xs text-base-content/60">per year</div>
                                                </div>
                                            </div>
                                            <div className="grid sm:grid-cols-3 gap-3 mt-3">
                                                <div className="bg-base-200 rounded-lg p-2 text-center">
                                                    <div className="text-xs text-base-content/60">Sum Insured</div>
                                                    <div className="font-semibold text-sm">₹{plan.sum_insured.toLocaleString("en-IN")}</div>
                                                </div>
                                                <div className="bg-base-200 rounded-lg p-2 text-center">
                                                    <div className="text-xs text-base-content/60">Copay</div>
                                                    <div className="font-semibold text-sm">{plan.co_payment}%</div>
                                                </div>
                                                <div className="bg-base-200 rounded-lg p-2 text-center">
                                                    <div className="text-xs text-base-content/60">Maternity</div>
                                                    <div className="font-semibold text-sm">
                                                        {plan.maternity_covered ? (
                                                            <span className="text-success flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Yes</span>
                                                        ) : (
                                                            <span className="text-base-content/40">No</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
