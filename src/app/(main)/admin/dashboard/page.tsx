"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Building2, Calendar, CheckCircle, XCircle, AlertTriangle,
    TrendingUp, LogOut, Search, ChevronDown, ChevronUp
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { useSession, signOut } from "@/lib/auth-client";

interface Hospital {
    id: string;
    name: string;
    type: string;
    city: string;
    state: string;
    phone: string;
    email: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    _count: { doctors: number; appointments: number };
}

interface Appointment {
    id: string;
    procedure: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    patientName: string;
    estimatedCost: number | null;
    hospital: { id: string; name: string; city: string } | null;
    doctor: { id: string; name: string; specialty: string } | null;
}

const STATUS_BADGE: Record<string, string> = {
    confirmed: "badge-success",
    pending: "badge-warning",
    cancelled: "badge-error",
    completed: "badge-info",
};

export default function AdminDashboard() {
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const [activeTab, setActiveTab] = useState("hospitals");
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [hospitalFilter, setHospitalFilter] = useState<"all" | "verified" | "unverified">("all");
    const [searchQ, setSearchQ] = useState("");
    const [expandedHospital, setExpandedHospital] = useState<string | null>(null);

    const userRole = (session?.user as { role?: string } | null)?.role;

    useEffect(() => {
        if (!isPending && !session?.user) router.push("/auth/login");
        if (!isPending && session?.user && userRole !== "admin") router.push("/");
    }, [session, isPending, router, userRole]);

    useEffect(() => {
        if (!session?.user || userRole !== "admin") return;
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [hospRes, apptRes] = await Promise.all([
                    fetch("/api/admin/hospitals").then(r => r.json()).catch(() => ({ hospitals: [] })),
                    fetch("/api/admin/appointments").then(r => r.json()).catch(() => ({ appointments: [] })),
                ]);
                setHospitals(hospRes.hospitals || []);
                setAppointments(apptRes.appointments || []);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [session, userRole]);

    const toggleVerify = async (id: string, isVerified: boolean) => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/admin/hospitals/${id}/verify`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isVerified }),
            });
            if (res.ok) {
                setHospitals(prev => prev.map(h => h.id === id ? { ...h, isVerified } : h));
            }
        } finally {
            setUpdating(null);
        }
    };

    const toggleActive = async (id: string, isActive: boolean) => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/admin/hospitals/${id}/verify`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive }),
            });
            if (res.ok) {
                setHospitals(prev => prev.map(h => h.id === id ? { ...h, isActive } : h));
            }
        } finally {
            setUpdating(null);
        }
    };

    if (isPending) return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>;
    if (!session?.user || userRole !== "admin") return null;

    const user = session.user;
    const initials = (user.name || "A").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

    const filteredHospitals = hospitals.filter(h => {
        const matchesFilter = hospitalFilter === "all" ? true : hospitalFilter === "verified" ? h.isVerified : !h.isVerified;
        const matchesSearch = !searchQ || h.name.toLowerCase().includes(searchQ.toLowerCase()) || h.city.toLowerCase().includes(searchQ.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const verified = hospitals.filter(h => h.isVerified).length;
    const unverified = hospitals.filter(h => !h.isVerified).length;
    const todayAppts = appointments.filter(a => new Date(a.appointmentDate).toISOString().split("T")[0] === new Date().toISOString().split("T")[0]).length;

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
                                        <div className="bg-error text-error-content rounded-full w-16">
                                            <span className="text-xl">{initials}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">{user.name}</h2>
                                        <p className="text-sm text-base-content/60">{user.email}</p>
                                        <span className="badge badge-error badge-sm mt-1">Admin</span>
                                    </div>
                                </div>
                                <ul className="menu p-0 gap-1">
                                    {[
                                        { id: "hospitals", label: "Hospitals", icon: Building2 },
                                        { id: "appointments", label: "Appointments", icon: Calendar },
                                    ].map(tab => (
                                        <li key={tab.id}>
                                            <button className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
                                                <tab.icon className="w-4 h-4" /> {tab.label}
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
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-primary"><Building2 className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Total Hospitals</div>
                                <div className="stat-value text-primary text-2xl">{hospitals.length}</div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-success"><CheckCircle className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Verified</div>
                                <div className="stat-value text-success text-2xl">{verified}</div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-warning"><AlertTriangle className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Pending Review</div>
                                <div className="stat-value text-warning text-2xl">{unverified}</div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-secondary"><TrendingUp className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Today&apos;s Appts</div>
                                <div className="stat-value text-secondary text-2xl">{todayAppts}</div>
                            </div>
                        </div>

                        {/* Hospitals Tab */}
                        {activeTab === "hospitals" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                        <h3 className="card-title"><Building2 className="w-5 h-5" /> Registered Hospitals</h3>
                                        <div className="flex gap-2">
                                            <div className="join">
                                                {(["all", "unverified", "verified"] as const).map(f => (
                                                    <button key={f} className={`btn btn-xs join-item ${hospitalFilter === f ? "btn-primary" : "btn-ghost"}`} onClick={() => setHospitalFilter(f)}>
                                                        {f === "all" ? "All" : f === "verified" ? "Verified" : "Pending"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <label className="input input-bordered input-sm flex items-center gap-2 mb-4">
                                        <Search className="w-4 h-4 opacity-50" />
                                        <input type="text" placeholder="Search hospitals…" value={searchQ} onChange={e => setSearchQ(e.target.value)} className="grow" />
                                    </label>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : filteredHospitals.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Building2 className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60">No hospitals found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredHospitals.map(h => (
                                                <div key={h.id} className="border border-base-300 rounded-lg overflow-hidden">
                                                    <div className="flex items-center justify-between p-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold">{h.name}</span>
                                                                <span className="badge badge-ghost badge-sm">{h.type}</span>
                                                                {h.isVerified ? (
                                                                    <span className="badge badge-success badge-sm gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>
                                                                ) : (
                                                                    <span className="badge badge-warning badge-sm gap-1"><AlertTriangle className="w-3 h-3" /> Pending</span>
                                                                )}
                                                                {!h.isActive && <span className="badge badge-error badge-sm">Inactive</span>}
                                                            </div>
                                                            <p className="text-sm text-base-content/60">{h.city}, {h.state} • {h.phone}</p>
                                                            <p className="text-xs text-base-content/50">{h._count.doctors} doctors • {h._count.appointments} appointments • Registered {new Date(h.createdAt).toLocaleDateString("en-IN")}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button className="btn btn-ghost btn-xs" onClick={() => setExpandedHospital(expandedHospital === h.id ? null : h.id)}>
                                                                {expandedHospital === h.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {expandedHospital === h.id && (
                                                        <div className="bg-base-200 px-4 pb-4 flex gap-2 flex-wrap">
                                                            {!h.isVerified ? (
                                                                <button
                                                                    className="btn btn-success btn-sm gap-1"
                                                                    disabled={updating === h.id}
                                                                    onClick={() => toggleVerify(h.id, true)}
                                                                >
                                                                    <CheckCircle className="w-4 h-4" /> Verify Hospital
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="btn btn-warning btn-sm gap-1"
                                                                    disabled={updating === h.id}
                                                                    onClick={() => toggleVerify(h.id, false)}
                                                                >
                                                                    <XCircle className="w-4 h-4" /> Revoke Verification
                                                                </button>
                                                            )}
                                                            {h.isActive ? (
                                                                <button
                                                                    className="btn btn-error btn-sm gap-1"
                                                                    disabled={updating === h.id}
                                                                    onClick={() => toggleActive(h.id, false)}
                                                                >
                                                                    <XCircle className="w-4 h-4" /> Deactivate
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="btn btn-success btn-sm gap-1"
                                                                    disabled={updating === h.id}
                                                                    onClick={() => toggleActive(h.id, true)}
                                                                >
                                                                    <CheckCircle className="w-4 h-4" /> Activate
                                                                </button>
                                                            )}
                                                            {updating === h.id && <span className="loading loading-spinner loading-sm" />}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Appointments Tab */}
                        {activeTab === "appointments" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><Calendar className="w-5 h-5" /> All Appointments</h3>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : appointments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Calendar className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60">No appointments recorded yet</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Patient</th>
                                                        <th>Procedure</th>
                                                        <th>Hospital</th>
                                                        <th>Doctor</th>
                                                        <th>Date</th>
                                                        <th>Status</th>
                                                        <th>Cost</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {appointments.map(a => (
                                                        <tr key={a.id}>
                                                            <td className="font-medium">{a.patientName}</td>
                                                            <td>{a.procedure}</td>
                                                            <td>{a.hospital?.name ?? "—"}<br /><span className="text-xs text-base-content/50">{a.hospital?.city}</span></td>
                                                            <td>{a.doctor ? `Dr. ${a.doctor.name}` : "—"}</td>
                                                            <td>{new Date(a.appointmentDate).toLocaleDateString("en-IN")}<br />
                                                                <span className="text-xs text-base-content/50">{a.appointmentTime}</span>
                                                            </td>
                                                            <td><span className={`badge badge-sm ${STATUS_BADGE[a.status] || "badge-ghost"}`}>{a.status}</span></td>
                                                            <td>{a.estimatedCost ? `₹${a.estimatedCost.toLocaleString("en-IN")}` : "—"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
