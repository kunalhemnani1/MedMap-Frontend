"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    User,
    Heart,
    Settings,
    Shield,
    LogOut,
    Building2,
    Search,
    Bell,
    TrendingDown,
    Calendar,
    ChevronRight,
    ClipboardList,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { useSession, signOut } from "@/lib/auth-client";

interface Bookmark {
    id: string;
    hospitalId: number;
    note: string | null;
    createdAt: string;
}

interface Booking {
    id: string;
    hospital_name: string;
    procedure: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    estimated_cost: number;
    doctor_name: string;
}

const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "saved", label: "Saved", icon: Heart },
    { id: "insurance", label: "Insurance", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
];

export default function DashboardPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const [activeTab, setActiveTab] = useState("overview");
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isPending && !session?.user) {
            router.push("/auth/login");
        }
    }, [session, isPending, router]);

    useEffect(() => {
        if (!session?.user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [bkRes, boRes] = await Promise.all([
                    fetch("/api/bookmarks").then((r) => r.json()).catch(() => ({ bookmarks: [] })),
                    fetch("/api/bookings?limit=10").then((r) => r.json()).catch(() => ({ results: [] })),
                ]);
                setBookmarks(bkRes.bookmarks || []);
                setBookings(boRes.results || []);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [session]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (!session?.user) return null;

    const user = session.user;
    const initials = (user.name || "U")
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const upcomingBookings = bookings.filter((b) => b.status === "Confirmed" || b.status === "Pending");

    return (
        <div className="min-h-screen bg-base-200">
            <Breadcrumb />

            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="card bg-base-100 shadow-lg sticky top-24">
                            <div className="card-body">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="avatar placeholder">
                                        <div className="bg-primary text-primary-content rounded-full w-16">
                                            <span className="text-xl">{initials}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">{user.name}</h2>
                                        <p className="text-sm text-base-content/60">{user.email}</p>
                                        <span className="badge badge-primary badge-sm mt-1 capitalize">
                                            {(user as any).role || "user"}
                                        </span>
                                    </div>
                                </div>

                                <ul className="menu p-0 gap-1">
                                    {tabs.map((tab) => (
                                        <li key={tab.id}>
                                            <button
                                                className={activeTab === tab.id ? "active" : ""}
                                                onClick={() => setActiveTab(tab.id)}
                                            >
                                                <tab.icon className="w-4 h-4" />
                                                {tab.label}
                                            </button>
                                        </li>
                                    ))}
                                    <div className="divider my-2" />
                                    <li>
                                        <button
                                            className="text-error"
                                            onClick={() => signOut().then(() => router.push("/"))}
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {activeTab === "overview" && (
                            <>
                                <div className="card bg-linear-to-r from-primary to-secondary text-primary-content">
                                    <div className="card-body">
                                        <h2 className="card-title text-2xl">Welcome back, {user.name?.split(" ")[0]}!</h2>
                                        <p className="opacity-80">
                                            Continue exploring healthcare options and save more on medical costs.
                                        </p>
                                        <div className="card-actions mt-4">
                                            <Link href="/search" className="btn btn-ghost gap-2">
                                                <Search className="w-4 h-4" /> New Search
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="stat bg-base-100 rounded-xl shadow">
                                        <div className="stat-figure text-primary"><Heart className="w-8 h-8" /></div>
                                        <div className="stat-title">Saved</div>
                                        <div className="stat-value text-primary">{bookmarks.length}</div>
                                    </div>
                                    <div className="stat bg-base-100 rounded-xl shadow">
                                        <div className="stat-figure text-secondary"><Calendar className="w-8 h-8" /></div>
                                        <div className="stat-title">Bookings</div>
                                        <div className="stat-value text-secondary">{bookings.length}</div>
                                    </div>
                                    <div className="stat bg-base-100 rounded-xl shadow">
                                        <div className="stat-figure text-success"><TrendingDown className="w-8 h-8" /></div>
                                        <div className="stat-title">Upcoming</div>
                                        <div className="stat-value text-success">{upcomingBookings.length}</div>
                                    </div>
                                </div>

                                {upcomingBookings.length > 0 && (
                                    <div className="card bg-base-100 shadow-lg">
                                        <div className="card-body">
                                            <h3 className="card-title"><Calendar className="w-5 h-5" /> Upcoming Appointments</h3>
                                            <div className="space-y-3">
                                                {upcomingBookings.slice(0, 3).map((b) => (
                                                    <div key={b.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                                                        <div>
                                                            <p className="font-medium">{b.procedure}</p>
                                                            <p className="text-sm text-base-content/60">{b.hospital_name} - Dr. {b.doctor_name}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium">{b.appointment_date}</p>
                                                            <p className="text-xs text-base-content/60">{b.appointment_time}</p>
                                                            <span className={`badge badge-sm ${b.status === "Confirmed" ? "badge-success" : "badge-warning"}`}>
                                                                {b.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h3 className="card-title"><Bell className="w-5 h-5" /> Notifications</h3>
                                        <div className="text-center py-6 text-base-content/50">
                                            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p>No new notifications</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === "bookings" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><ClipboardList className="w-5 h-5" /> Your Bookings</h3>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : bookings.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Calendar className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60">No bookings yet</p>
                                            <Link href="/search" className="btn btn-primary mt-4">Find Hospitals</Link>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Procedure</th>
                                                        <th>Hospital</th>
                                                        <th>Date</th>
                                                        <th>Status</th>
                                                        <th>Cost</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bookings.map((b) => (
                                                        <tr key={b.id}>
                                                            <td className="font-medium">{b.procedure}</td>
                                                            <td>{b.hospital_name}</td>
                                                            <td>{b.appointment_date}<br /><span className="text-xs text-base-content/60">{b.appointment_time}</span></td>
                                                            <td>
                                                                <span className={`badge badge-sm ${b.status === "Confirmed" ? "badge-success" :
                                                                        b.status === "Cancelled" ? "badge-error" :
                                                                            b.status === "Completed" ? "badge-info" : "badge-warning"
                                                                    }`}>{b.status}</span>
                                                            </td>
                                                            <td>₹{b.estimated_cost?.toLocaleString("en-IN")}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "saved" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><Heart className="w-5 h-5 text-error" /> Saved Hospitals</h3>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : bookmarks.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Heart className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60">No saved hospitals yet</p>
                                            <Link href="/search" className="btn btn-primary mt-4">Explore Hospitals</Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {bookmarks.map((bk) => (
                                                <div key={bk.id} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="avatar placeholder">
                                                            <div className="bg-primary text-primary-content rounded-lg w-12">
                                                                <Building2 className="w-6 h-6" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold">Hospital #{bk.hospitalId}</h4>
                                                            {bk.note && <p className="text-sm text-base-content/60">{bk.note}</p>}
                                                            <p className="text-xs text-base-content/40">Saved {new Date(bk.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <Link href={`/hospital/${bk.hospitalId}`} className="btn btn-ghost btn-sm">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "insurance" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><Shield className="w-5 h-5 text-primary" /> Insurance Profiles</h3>
                                    <p className="text-base-content/60 mb-4">Save your insurance details for quick coverage checks.</p>
                                    <div className="alert">
                                        <Shield className="w-5 h-5" />
                                        <span>No insurance profiles saved yet.</span>
                                        <Link href="/insurance-checker" className="btn btn-sm btn-primary">Add Insurance</Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "settings" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><Settings className="w-5 h-5" /> Account Settings</h3>
                                    <div className="space-y-4 mt-4">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Name</span></label>
                                            <input type="text" value={user.name || ""} className="input input-bordered" readOnly />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Email</span></label>
                                            <input type="email" value={user.email || ""} className="input input-bordered" readOnly />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Role</span></label>
                                            <input type="text" value={(user as any).role || "user"} className="input input-bordered capitalize" readOnly />
                                        </div>
                                        <div className="form-control">
                                            <label className="label cursor-pointer">
                                                <span className="label-text font-medium">Email Notifications</span>
                                                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                                            </label>
                                        </div>
                                        <div className="form-control">
                                            <label className="label cursor-pointer">
                                                <span className="label-text font-medium">Price Alerts</span>
                                                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
