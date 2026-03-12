"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stethoscope, Calendar, Building2, Users, CheckCircle, XCircle, Clock, LogOut, ChevronRight } from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { useSession, signOut } from "@/lib/auth-client";

interface Appointment {
    id: string;
    procedure: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    estimatedCost: number | null;
    notes: string | null;
    hospital: { id: string; name: string; city: string } | null;
    doctor: { id: string; name: string; specialty: string } | null;
}

interface Hospital {
    id: string;
    name: string;
    city: string;
    state: string;
    isVerified: boolean;
    isActive: boolean;
    _count: { doctors: number; appointments: number };
}

const STATUS_BADGE: Record<string, string> = {
    confirmed: "badge-success",
    pending: "badge-warning",
    cancelled: "badge-error",
    completed: "badge-info",
};

export default function DoctorDashboard() {
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const [activeTab, setActiveTab] = useState("appointments");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isPending && !session?.user) router.push("/auth/login");
    }, [session, isPending, router]);

    useEffect(() => {
        if (!session?.user) return;
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [apptRes, hospRes] = await Promise.all([
                    fetch("/api/doctor/appointments").then(r => r.json()).catch(() => ({ appointments: [] })),
                    fetch("/api/registered-hospitals/mine").then(r => r.json()).catch(() => ({ hospitals: [] })),
                ]);
                setAppointments(apptRes.appointments || []);
                setHospitals(hospRes.hospitals || []);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [session]);

    const updateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/appointments/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            }
        } finally {
            setUpdatingId(null);
        }
    };

    if (isPending) return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>;
    if (!session?.user) return null;

    const user = session.user;
    const initials = (user.name || "D").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
    const todayStr = new Date().toISOString().split("T")[0];
    const todayAppts = appointments.filter(a => new Date(a.appointmentDate).toISOString().split("T")[0] === todayStr);
    const pendingAppts = appointments.filter(a => a.status === "confirmed" || a.status === "pending");

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
                                            <span className="text-xl">{initials}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">{user.name}</h2>
                                        <p className="text-sm text-base-content/60">{user.email}</p>
                                        <span className="badge badge-secondary badge-sm mt-1">Doctor / Provider</span>
                                    </div>
                                </div>
                                <ul className="menu p-0 gap-1">
                                    {[
                                        { id: "appointments", label: "Appointments", icon: Calendar },
                                        { id: "hospitals", label: "My Hospitals", icon: Building2 },
                                    ].map(tab => (
                                        <li key={tab.id}>
                                            <button className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
                                                <tab.icon className="w-4 h-4" /> {tab.label}
                                            </button>
                                        </li>
                                    ))}
                                    <div className="divider my-2" />
                                    <li>
                                        <Link href="/providers/dashboard">
                                            <Users className="w-4 h-4" /> Provider Dashboard
                                        </Link>
                                    </li>
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
                                <div className="stat-figure text-primary"><Stethoscope className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Total</div>
                                <div className="stat-value text-primary text-2xl">{appointments.length}</div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-warning"><Clock className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Today</div>
                                <div className="stat-value text-warning text-2xl">{todayAppts.length}</div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-success"><CheckCircle className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Upcoming</div>
                                <div className="stat-value text-success text-2xl">{pendingAppts.length}</div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-secondary"><Building2 className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Hospitals</div>
                                <div className="stat-value text-secondary text-2xl">{hospitals.length}</div>
                            </div>
                        </div>

                        {activeTab === "appointments" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><Calendar className="w-5 h-5" /> Patient Appointments</h3>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : appointments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Calendar className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60 mb-4">No appointments yet</p>
                                            <Link href="/providers/dashboard" className="btn btn-primary btn-sm">Manage Hospital</Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {appointments.map(a => (
                                                <div key={a.id} className="border border-base-300 rounded-lg p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold">{a.patientName}</span>
                                                                <span className={`badge badge-sm ${STATUS_BADGE[a.status] || "badge-ghost"}`}>{a.status}</span>
                                                            </div>
                                                            <p className="text-sm text-base-content/70 mb-1">
                                                                <strong>Procedure:</strong> {a.procedure}
                                                                {a.hospital && <span className="ml-2 text-base-content/50">@ {a.hospital.name}</span>}
                                                            </p>
                                                            <p className="text-sm text-base-content/60">
                                                                {new Date(a.appointmentDate).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })} at {a.appointmentTime}
                                                            </p>
                                                            <p className="text-sm text-base-content/60">
                                                                📞 {a.patientPhone} • ✉️ {a.patientEmail}
                                                            </p>
                                                            {a.notes && <p className="text-xs text-base-content/50 mt-1 italic">Note: {a.notes}</p>}
                                                        </div>
                                                        <div className="flex flex-col gap-2 shrink-0">
                                                            {a.status === "confirmed" || a.status === "pending" ? (
                                                                <>
                                                                    <button
                                                                        className="btn btn-success btn-xs gap-1"
                                                                        disabled={updatingId === a.id}
                                                                        onClick={() => updateStatus(a.id, "completed")}
                                                                    >
                                                                        <CheckCircle className="w-3 h-3" /> Complete
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-error btn-xs gap-1"
                                                                        disabled={updatingId === a.id}
                                                                        onClick={() => updateStatus(a.id, "cancelled")}
                                                                    >
                                                                        <XCircle className="w-3 h-3" /> Cancel
                                                                    </button>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "hospitals" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="card-title"><Building2 className="w-5 h-5" /> My Registered Hospitals</h3>
                                        <Link href="/providers/register" className="btn btn-primary btn-sm">+ Register Hospital</Link>
                                    </div>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : hospitals.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Building2 className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60 mb-4">No hospitals registered yet</p>
                                            <Link href="/providers/register" className="btn btn-primary">Register Your Hospital</Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {hospitals.map(h => (
                                                <div key={h.id} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold">{h.name}</h4>
                                                            {h.isVerified && <span className="badge badge-success badge-sm">Verified</span>}
                                                            {!h.isActive && <span className="badge badge-error badge-sm">Inactive</span>}
                                                        </div>
                                                        <p className="text-sm text-base-content/60">{h.city}, {h.state}</p>
                                                        <p className="text-xs text-base-content/50">
                                                            {h._count.doctors} doctor(s) • {h._count.appointments} appointment(s)
                                                        </p>
                                                    </div>
                                                    <Link href={`/providers/dashboard`} className="btn btn-ghost btn-sm">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            ))}
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
