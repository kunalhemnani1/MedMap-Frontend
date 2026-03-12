"use client";

import { useState, useEffect, useCallback } from "react";
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    Activity,
    IndianRupee,
    Building2,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    RefreshCw,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";

interface Category {
    name: string;
    count: number;
    avg_price: number;
}

interface HospitalStats {
    total_hospitals: number;
    total_states: number;
    total_districts: number;
}

interface PricingResult {
    procedure: string;
    category: string;
    price: number;
    hospital_name: string;
    state: string;
}

const POLL_INTERVAL = 30000; // 30s refresh

export default function InsightsPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [stats, setStats] = useState<HospitalStats | null>(null);
    const [topPrices, setTopPrices] = useState<PricingResult[]>([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [catRes, statsRes, pricesRes] = await Promise.all([
                fetch("/api/pricing/categories").then((r) => r.json()).catch(() => ({ categories: [] })),
                fetch("/api/hospitals/stats").then((r) => r.json()).catch(() => null),
                fetch("/api/pricing/search?limit=10&sort=price-desc").then((r) => r.json()).catch(() => ({ results: [] })),
            ]);
            setCategories(catRes.categories || []);
            setStats(statsRes);
            setTopPrices(pricesRes.results || []);
            setLastUpdated(new Date());
        } finally {
            setLoadingCats(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData]);

    const totalProcedures = categories.reduce((s, c) => s + c.count, 0);
    const avgOverallPrice = categories.length
        ? Math.round(categories.reduce((s, c) => s + c.avg_price * c.count, 0) / totalProcedures)
        : 0;

    // Sort categories by avg_price for display
    const topExpensive = [...categories].sort((a, b) => b.avg_price - a.avg_price).slice(0, 6);
    const topAffordable = [...categories].sort((a, b) => a.avg_price - b.avg_price).slice(0, 6);
    const maxCatCount = Math.max(...categories.map((c) => c.count), 1);

    return (
        <div className="min-h-screen bg-base-200">
            <Breadcrumb />

            {/* Hero */}
            <section className="bg-linear-to-br from-info/10 via-base-100 to-primary/10 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-info/10 text-info px-4 py-2 rounded-full mb-6">
                            <TrendingUp className="w-5 h-5" />
                            <span className="font-medium">Market Insights</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Healthcare Price Trends</h1>
                        <p className="text-lg text-base-content/70">
                            Real-time data insights into medical procedure costs across India.
                        </p>
                        {lastUpdated && (
                            <p className="text-sm text-base-content/40 mt-2 flex items-center justify-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Updated {lastUpdated.toLocaleTimeString()} (refreshes every 30s)
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12">
                {/* Key Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    <div className="stat bg-base-100 rounded-xl shadow">
                        <div className="stat-figure text-primary"><IndianRupee className="w-8 h-8" /></div>
                        <div className="stat-title">Avg. Price</div>
                        <div className="stat-value text-primary">₹{avgOverallPrice.toLocaleString("en-IN")}</div>
                        <div className="stat-desc">Across all categories</div>
                    </div>

                    <div className="stat bg-base-100 rounded-xl shadow">
                        <div className="stat-figure text-secondary"><Building2 className="w-8 h-8" /></div>
                        <div className="stat-title">Hospitals Tracked</div>
                        <div className="stat-value text-secondary">{(stats?.total_hospitals || 0).toLocaleString()}</div>
                        <div className="stat-desc">{stats?.total_states || 0} states, {stats?.total_districts || 0} districts</div>
                    </div>

                    <div className="stat bg-base-100 rounded-xl shadow">
                        <div className="stat-figure text-accent"><Activity className="w-8 h-8" /></div>
                        <div className="stat-title">Procedures</div>
                        <div className="stat-value text-accent">{totalProcedures.toLocaleString()}</div>
                        <div className="stat-desc">Price points analyzed</div>
                    </div>

                    <div className="stat bg-base-100 rounded-xl shadow">
                        <div className="stat-figure text-info"><PieChart className="w-8 h-8" /></div>
                        <div className="stat-title">Categories</div>
                        <div className="stat-value text-info">{categories.length}</div>
                        <div className="stat-desc">Procedure types</div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Top Expensive Procedures */}
                    <div className="lg:col-span-2">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="card-title">
                                        <BarChart3 className="w-5 h-5 text-primary" />
                                        Category Avg. Prices
                                    </h2>
                                </div>

                                {loadingCats ? (
                                    <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Category</th>
                                                    <th className="text-right">Avg. Price</th>
                                                    <th className="text-right">Procedures</th>
                                                    <th>Distribution</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topExpensive.map((cat) => (
                                                    <tr key={cat.name}>
                                                        <td className="font-medium">{cat.name}</td>
                                                        <td className="text-right">₹{cat.avg_price.toLocaleString("en-IN")}</td>
                                                        <td className="text-right">{cat.count.toLocaleString()}</td>
                                                        <td>
                                                            <div className="w-24 bg-base-200 rounded-full h-3">
                                                                <div
                                                                    className="bg-primary rounded-full h-3 transition-all"
                                                                    style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top 10 Most Expensive Procedures */}
                        <div className="card bg-base-100 shadow-lg mt-6">
                            <div className="card-body">
                                <h2 className="card-title">
                                    <TrendingUp className="w-5 h-5 text-error" />
                                    Highest Priced Procedures
                                </h2>
                                {topPrices.length === 0 ? (
                                    <p className="text-base-content/60 text-sm">Loading...</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Procedure</th>
                                                    <th>Hospital</th>
                                                    <th>State</th>
                                                    <th className="text-right">Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topPrices.map((p, i) => (
                                                    <tr key={i}>
                                                        <td className="font-medium">{p.procedure}</td>
                                                        <td className="text-sm">{p.hospital_name}</td>
                                                        <td className="text-sm">{p.state}</td>
                                                        <td className="text-right font-semibold text-error">
                                                            ₹{p.price?.toLocaleString("en-IN")}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Most Affordable Categories */}
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">
                                    <TrendingDown className="w-5 h-5 text-success" />
                                    Most Affordable
                                </h2>
                                <p className="text-sm text-base-content/60 mb-4">Categories with lowest avg. prices</p>
                                <div className="space-y-3">
                                    {topAffordable.map((cat) => (
                                        <div key={cat.name} className="flex items-center justify-between p-3 bg-success/5 rounded-lg">
                                            <span className="text-sm font-medium">{cat.name}</span>
                                            <span className="badge badge-success badge-sm">
                                                ₹{cat.avg_price.toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Best Time to Book */}
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    Booking Tips
                                </h2>
                                <p className="text-sm text-base-content/60 mb-4">
                                    Tips based on pricing data analysis:
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                                        <span className="text-sm">Compare 3+ hospitals</span>
                                        <span className="badge badge-success badge-sm">Save 20-40%</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                                        <span className="text-sm">Check insurance coverage</span>
                                        <span className="badge badge-success badge-sm">Avg 60% covered</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-info/10 rounded-lg">
                                        <span className="text-sm">Use price estimator</span>
                                        <span className="badge badge-info badge-sm">Get fair price</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
