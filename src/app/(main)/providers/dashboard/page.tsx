"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    BarChart3,
    Users,
    TrendingUp,
    Settings,
    Calendar,
    IndianRupee,
    Bell,
    Building2,
    Stethoscope,
    ClipboardList,
    ChevronRight,
    LogOut,
    Search,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { useSession, signOut } from "@/lib/auth-client";

interface Booking {
    id: string;
    hospital_name: string;
    user_name: string;
    procedure: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    estimated_cost: number;
    doctor_name: string;
}

const providerTabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "patients", label: "Patients", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
];

export default function ProviderDashboardPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const [activeTab, setActiveTab] = useState("overview");
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isPending && !session?.user) {
            router.push("/auth/login");
        }
    }, [session, isPending, router]);

    useEffect(() => {
        if (!session?.user) return;
        fetch("/api/bookings?limit=20")
            .then((r) => r.json())
            .then((d) => setBookings(d.results || []))
            .catch(() => { })
            .finally(() => setLoading(false));
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
    const role = (user as any).role || "user";
    const isDoctor = role === "doctor";
    const isAdmin = role === "admin";
    const avatarLetter = (user.name?.trim()?.[0] || "U").toUpperCase();

    const todayBookings = bookings.filter((b) => b.status === "Confirmed" || b.status === "Pending");
    const completedBookings = bookings.filter((b) => b.status === "Completed");
    const totalRevenue = bookings.reduce((s, b) => s + (b.estimated_cost || 0), 0);

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
                                        <div className="bg-secondary text-secondary-content rounded-full w-16">
                                            <span className="text-xl">{avatarLetter}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">{user.name}</h2>
                                        <p className="text-sm text-base-content/60">{user.email}</p>
                                        <span className="badge badge-secondary mt-2 px-3 py-1 capitalize">{role}</span>
                                    </div>
                                </div>

                                <ul className="menu p-0 gap-1">
                                    {providerTabs.map((tab) => (
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
                                        <button className="text-error" onClick={() => signOut().then(() => router.push("/"))}>
                                            <LogOut className="w-4 h-4" /> Sign Out
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
                                <div className="card bg-linear-to-r from-secondary to-accent text-white">
                                    <div className="card-body">
                                        <h2 className="card-title text-2xl">
                                            {isDoctor ? "Doctor" : "Hospital Admin"} Dashboard
                                        </h2>
                                        <p className="opacity-80">Manage your {isDoctor ? "patients and appointments" : "hospital and staff"}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="stat bg-base-100 rounded-xl shadow">
                                        <div className="stat-figure text-primary"><Calendar className="w-8 h-8" /></div>
                                        <div className="stat-title">Upcoming</div>
                                        <div className="stat-value text-primary">{todayBookings.length}</div>
                                    </div>
                                    <div className="stat bg-base-100 rounded-xl shadow">
                                        <div className="stat-figure text-success"><ClipboardList className="w-8 h-8" /></div>
                                        <div className="stat-title">Completed</div>
                                        <div className="stat-value text-success">{completedBookings.length}</div>
                                    </div>
                                    <div className="stat bg-base-100 rounded-xl shadow">
                                        <div className="stat-figure text-secondary"><Users className="w-8 h-8" /></div>
                                        <div className="stat-title">Total</div>
                                        <div className="stat-value text-secondary">{bookings.length}</div>
                                    </div>
                                    <div className="stat bg-base-100 rounded-xl shadow">
                                        <div className="stat-figure text-warning"><IndianRupee className="w-8 h-8" /></div>
                                        <div className="stat-title">Revenue</div>
                                        <div className="stat-value text-warning text-2xl">₹{(totalRevenue / 1000).toFixed(0)}K</div>
                                    </div>
                                </div>

                                {todayBookings.length > 0 && (
                                    <div className="card bg-base-100 shadow-lg">
                                        <div className="card-body">
                                            <h3 className="card-title"><Calendar className="w-5 h-5" /> Upcoming Appointments</h3>
                                            <div className="space-y-3">
                                                {todayBookings.slice(0, 5).map((b) => (
                                                    <div key={b.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                                                        <div>
                                                            <p className="font-medium">{b.user_name}</p>
                                                            <p className="text-sm text-base-content/60">{b.procedure} - {b.hospital_name}</p>
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

                        {activeTab === "appointments" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><ClipboardList className="w-5 h-5" /> All Appointments</h3>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : bookings.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Calendar className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60">No appointments found</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Patient</th>
                                                        <th>Procedure</th>
                                                        <th>Date</th>
                                                        <th>Doctor</th>
                                                        <th>Status</th>
                                                        <th>Cost</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bookings.map((b) => (
                                                        <tr key={b.id}>
                                                            <td className="font-medium">{b.user_name}</td>
                                                            <td>{b.procedure}</td>
                                                            <td>{b.appointment_date}<br /><span className="text-xs text-base-content/60">{b.appointment_time}</span></td>
                                                            <td>Dr. {b.doctor_name}</td>
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

                        {activeTab === "patients" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><Users className="w-5 h-5" /> Patient Records</h3>
                                    {bookings.length === 0 ? (
                                        <div className="text-center py-12 text-base-content/50">
                                            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                            <p>No patient records found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {[...new Map(bookings.map((b) => [b.user_name, b])).values()].map((b) => (
                                                <div key={b.user_name} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="avatar placeholder">
                                                            <div className="bg-primary text-primary-content rounded-full w-10">
                                                                <span>{b.user_name?.[0] || "P"}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold">{b.user_name}</h4>
                                                            <p className="text-sm text-base-content/60">Last: {b.procedure}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm text-base-content/60">{b.appointment_date}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "settings" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><Settings className="w-5 h-5" /> Provider Settings</h3>
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
                                            <input type="text" value={role} className="input input-bordered capitalize" readOnly />
                                        </div>
                                        <div className="form-control">
                                            <label className="label cursor-pointer">
                                                <span className="label-text font-medium">Appointment Notifications</span>
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
