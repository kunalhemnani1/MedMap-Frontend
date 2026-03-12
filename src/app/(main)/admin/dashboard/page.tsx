"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Building2, Calendar, CheckCircle, XCircle, AlertTriangle,
    TrendingUp, LogOut, Search, ChevronDown, ChevronUp,
    Stethoscope, UserCheck, Flag, UserPlus, Plus, ShieldCheck
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

interface DoctorRequest {
    id: string;
    name: string;
    medicalRegNo: string;
    qualification: string;
    specialty: string;
    phone: string;
    email: string;
    documentUrl: string | null;
    status: string;
    adminNotes: string | null;
    createdAt: string;
    hospital: { id: string; name: string; city: string; state: string } | null;
    requester: { id: string; name: string; email: string } | null;
}

interface FlaggedReview {
    id: string;
    authorName: string;
    ratingOverall: number;
    rating: number;
    comment: string;
    flagReason: string | null;
    isFlagged: boolean;
    isVerifiedVisit: boolean;
    ipAddress: string | null;
    createdAt: string;
    hospital: { name: string } | null;
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
    const [doctorRequests, setDoctorRequests] = useState<DoctorRequest[]>([]);
    const [flaggedReviews, setFlaggedReviews] = useState<FlaggedReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [hospitalFilter, setHospitalFilter] = useState<"all" | "verified" | "unverified">("all");
    const [searchQ, setSearchQ] = useState("");
    const [expandedHospital, setExpandedHospital] = useState<string | null>(null);
    // Add doctor form
    const [addDoctorHospitalId, setAddDoctorHospitalId] = useState("");
    const [addDoctorForm, setAddDoctorForm] = useState({ name: "", email: "", qualification: "", specialty: "", phone: "", consultationFee: "" });
    const [addDoctorStatus, setAddDoctorStatus] = useState("");

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
                const [hospRes, apptRes, drRes, frRes] = await Promise.all([
                    fetch("/api/admin/hospitals").then(r => r.json()).catch(() => ({ hospitals: [] })),
                    fetch("/api/admin/appointments").then(r => r.json()).catch(() => ({ appointments: [] })),
                    fetch("/api/admin/doctor-requests?status=pending").then(r => r.json()).catch(() => ({ requests: [] })),
                    fetch("/api/admin/reviews/flagged").then(r => r.json()).catch(() => ({ reviews: [] })),
                ]);
                setHospitals(hospRes.hospitals || []);
                setAppointments(apptRes.appointments || []);
                setDoctorRequests(drRes.requests || []);
                setFlaggedReviews(frRes.reviews || []);
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
            if (res.ok) setHospitals(prev => prev.map(h => h.id === id ? { ...h, isVerified } : h));
        } finally { setUpdating(null); }
    };

    const toggleActive = async (id: string, isActive: boolean) => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/admin/hospitals/${id}/verify`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive }),
            });
            if (res.ok) setHospitals(prev => prev.map(h => h.id === id ? { ...h, isActive } : h));
        } finally { setUpdating(null); }
    };

    const handleDecideRequest = async (id: string, decision: "approved" | "rejected") => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/admin/doctor-requests/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision }),
            });
            if (res.ok) setDoctorRequests(prev => prev.filter(r => r.id !== id));
        } finally { setUpdating(null); }
    };

    const handleAdminAddDoctor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addDoctorHospitalId) return;
        setAddDoctorStatus("submitting");
        try {
            const res = await fetch(`/api/admin/hospitals/${addDoctorHospitalId}/doctors`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(addDoctorForm),
            });
            const data = await res.json();
            if (res.ok) {
                setAddDoctorStatus("Doctor added! They must accept the invite from their dashboard.");
                setAddDoctorForm({ name: "", email: "", qualification: "", specialty: "", phone: "", consultationFee: "" });
                setAddDoctorHospitalId("");
            } else {
                setAddDoctorStatus(data.error || "Failed to add doctor.");
            }
        } catch {
            setAddDoctorStatus("Network error. Please try again.");
        }
    };

    const handleDeleteReview = async (id: string) => {
        if (!confirm("Delete this flagged review permanently?")) return;
        setUpdating(id);
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
            if (res.ok) setFlaggedReviews(prev => prev.filter(r => r.id !== id));
        } finally { setUpdating(null); }
    };

    const handleUnflagReview = async (id: string) => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/admin/reviews/${id}/unflag`, { method: "PATCH" });
            if (res.ok) setFlaggedReviews(prev => prev.filter(r => r.id !== id));
        } finally { setUpdating(null); }
    };

    if (isPending) return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>;
    if (!session?.user || userRole !== "admin") return null;

    const user = session.user;
    const avatarLetter = (user.name?.trim()?.[0] || "A").toUpperCase();

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
                                            <span className="text-xl">{avatarLetter}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">{user.name}</h2>
                                        <p className="text-sm text-base-content/60">{user.email}</p>
                                        <span className="badge badge-error mt-2 px-3 py-1">Admin</span>
                                    </div>
                                </div>
                                <ul className="menu p-0 gap-1">
                                    {[
                                        { id: "hospitals", label: "Hospitals", icon: Building2 },
                                        { id: "appointments", label: "Appointments", icon: Calendar },
                                        { id: "doctor-requests", label: "Doctor Requests", icon: Stethoscope, badge: doctorRequests.length },
                                        { id: "add-doctor", label: "Add Doctor", icon: UserPlus },
                                        { id: "flagged-reviews", label: "Flagged Reviews", icon: Flag, badge: flaggedReviews.length },
                                    ].map(tab => (
                                        <li key={tab.id}>
                                            <button className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
                                                <tab.icon className="w-4 h-4" />
                                                {tab.label}
                                                {"badge" in tab && (tab.badge ?? 0) > 0 && (
                                                    <span className="badge badge-warning badge-xs">{tab.badge}</span>
                                                )}
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
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-primary"><Building2 className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Hospitals</div>
                                <div className="stat-value text-primary text-2xl">{hospitals.length}</div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-success"><CheckCircle className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Verified</div>
                                <div className="stat-value text-success text-2xl">{verified}</div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-warning"><AlertTriangle className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Unverified</div>
                                <div className="stat-value text-warning text-2xl">{unverified}</div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-secondary"><TrendingUp className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Today&apos;s Appts</div>
                                <div className="stat-value text-secondary text-2xl">{todayAppts}</div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow">
                                <div className="stat-figure text-error"><Stethoscope className="w-6 h-6" /></div>
                                <div className="stat-title text-xs">Dr Requests</div>
                                <div className="stat-value text-error text-2xl">{doctorRequests.length}</div>
                            </div>
                        </div>

                        {/* Hospitals Tab */}
                        {activeTab === "hospitals" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                        <h3 className="card-title"><Building2 className="w-5 h-5" /> Registered Hospitals</h3>
                                        <div className="join">
                                            {(["all", "unverified", "verified"] as const).map(f => (
                                                <button key={f} className={`btn btn-xs join-item ${hospitalFilter === f ? "btn-primary" : "btn-ghost"}`} onClick={() => setHospitalFilter(f)}>
                                                    {f === "all" ? "All" : f === "verified" ? "Verified" : "Pending"}
                                                </button>
                                            ))}
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
                                                            <p className="text-sm text-base-content/60">{h.city}, {h.state} &bull; {h.phone}</p>
                                                            <p className="text-xs text-base-content/50">{h._count.doctors} doctors &bull; {h._count.appointments} appts &bull; {new Date(h.createdAt).toLocaleDateString("en-IN")}</p>
                                                        </div>
                                                        <button className="btn btn-ghost btn-xs" onClick={() => setExpandedHospital(expandedHospital === h.id ? null : h.id)}>
                                                            {expandedHospital === h.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                    {expandedHospital === h.id && (
                                                        <div className="bg-base-200 px-4 pb-4 flex gap-2 flex-wrap">
                                                            {!h.isVerified ? (
                                                                <button className="btn btn-success btn-sm gap-1" disabled={updating === h.id} onClick={() => toggleVerify(h.id, true)}>
                                                                    <CheckCircle className="w-4 h-4" /> Verify
                                                                </button>
                                                            ) : (
                                                                <button className="btn btn-warning btn-sm gap-1" disabled={updating === h.id} onClick={() => toggleVerify(h.id, false)}>
                                                                    <XCircle className="w-4 h-4" /> Revoke
                                                                </button>
                                                            )}
                                                            {h.isActive ? (
                                                                <button className="btn btn-error btn-sm gap-1" disabled={updating === h.id} onClick={() => toggleActive(h.id, false)}>
                                                                    <XCircle className="w-4 h-4" /> Deactivate
                                                                </button>
                                                            ) : (
                                                                <button className="btn btn-success btn-sm gap-1" disabled={updating === h.id} onClick={() => toggleActive(h.id, true)}>
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
                                                <thead><tr><th>Patient</th><th>Procedure</th><th>Hospital</th><th>Doctor</th><th>Date</th><th>Status</th><th>Cost</th></tr></thead>
                                                <tbody>
                                                    {appointments.map(a => (
                                                        <tr key={a.id}>
                                                            <td className="font-medium">{a.patientName}</td>
                                                            <td>{a.procedure}</td>
                                                            <td>{a.hospital?.name ?? "—"}<br /><span className="text-xs text-base-content/50">{a.hospital?.city}</span></td>
                                                            <td>{a.doctor ? `Dr. ${a.doctor.name}` : "—"}</td>
                                                            <td>{new Date(a.appointmentDate).toLocaleDateString("en-IN")}<br /><span className="text-xs text-base-content/50">{a.appointmentTime}</span></td>
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

                        {/* Doctor Requests Tab */}
                        {activeTab === "doctor-requests" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><Stethoscope className="w-5 h-5" /> Doctor Registration Requests</h3>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : doctorRequests.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Stethoscope className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60">No pending doctor requests</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {doctorRequests.map(req => (
                                                <div key={req.id} className="border border-base-300 rounded-xl p-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold text-base">Dr. {req.name}</span>
                                                                <span className="badge badge-warning badge-sm">{req.status}</span>
                                                            </div>
                                                            <p className="text-sm text-base-content/70">{req.qualification} &bull; {req.specialty}</p>
                                                            <p className="text-sm">Reg No: <span className="font-mono">{req.medicalRegNo}</span></p>
                                                            <p className="text-sm">Hospital: <span className="font-medium">{req.hospital?.name ?? "—"}</span> <span className="text-xs text-base-content/50">({req.hospital?.city})</span></p>
                                                            {req.phone && <p className="text-sm">Phone: {req.phone}</p>}
                                                            {req.email && <p className="text-sm">Email: {req.email}</p>}
                                                            {req.requester && <p className="text-xs text-base-content/50">Requester: {req.requester.name} ({req.requester.email})</p>}
                                                            {req.documentUrl && (
                                                                <a href={req.documentUrl} target="_blank" rel="noopener noreferrer" className="link link-primary text-sm">View Identification Document</a>
                                                            )}
                                                        </div>
                                                        {req.status === "pending" && (
                                                            <div className="flex gap-2 shrink-0">
                                                                <button className="btn btn-success btn-sm" disabled={updating === req.id} onClick={() => handleDecideRequest(req.id, "approved")}>
                                                                    <UserCheck className="w-4 h-4" /> Approve
                                                                </button>
                                                                <button className="btn btn-error btn-sm" disabled={updating === req.id} onClick={() => handleDecideRequest(req.id, "rejected")}>
                                                                    Reject
                                                                </button>
                                                                {updating === req.id && <span className="loading loading-spinner loading-sm" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Add Doctor Tab */}
                        {activeTab === "add-doctor" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><UserPlus className="w-5 h-5" /> Add Doctor to Hospital</h3>
                                    <p className="text-sm text-base-content/60 mb-2">The doctor must accept the invite from their dashboard (3-way handshake).</p>
                                    <div className="form-control mb-3">
                                        <label className="label"><span className="label-text">Select Hospital</span></label>
                                        <select className="select select-bordered" value={addDoctorHospitalId} onChange={e => setAddDoctorHospitalId(e.target.value)}>
                                            <option value="">— Choose a hospital —</option>
                                            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}
                                        </select>
                                    </div>
                                    <form onSubmit={handleAdminAddDoctor} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {([
                                            { key: "name", label: "Full Name *", placeholder: "Dr. Amit Sharma", type: "text", required: true },
                                            { key: "email", label: "Account Email", placeholder: "doctor@example.com (links to MedMap account)", type: "email", required: false },
                                            { key: "qualification", label: "Qualification *", placeholder: "MBBS, MD", type: "text", required: true },
                                            { key: "specialty", label: "Specialty *", placeholder: "Cardiology", type: "text", required: true },
                                            { key: "phone", label: "Phone", placeholder: "+91 9999988888", type: "text", required: false },
                                            { key: "consultationFee", label: "Consultation Fee (₹)", placeholder: "500", type: "number", required: false },
                                        ] as const).map(f => (
                                            <div key={f.key} className="form-control">
                                                <label className="label"><span className="label-text">{f.label}</span></label>
                                                <input type={f.type} required={f.required} className="input input-bordered" placeholder={f.placeholder} value={addDoctorForm[f.key]} onChange={e => setAddDoctorForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                                            </div>
                                        ))}
                                        <div className="sm:col-span-2 flex items-center gap-4 mt-2">
                                            <button type="submit" className="btn btn-primary" disabled={!addDoctorHospitalId || !addDoctorForm.name || addDoctorStatus === "submitting"}>
                                                <Plus className="w-4 h-4" /> Add Doctor
                                            </button>
                                            {addDoctorStatus === "submitting" && <span className="loading loading-spinner loading-sm" />}
                                        </div>
                                    </form>
                                    {addDoctorStatus && addDoctorStatus !== "submitting" && (
                                        <div className={`alert mt-4 ${addDoctorStatus.startsWith("Doctor added") ? "alert-success" : "alert-error"}`}>{addDoctorStatus}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Flagged Reviews Tab */}
                        {activeTab === "flagged-reviews" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><Flag className="w-5 h-5" /> Flagged Reviews (Suspected Fake)</h3>
                                    <p className="text-sm text-base-content/60 mb-2">Reviews auto-flagged by same IP/subnet submitting multiple reviews in a short time.</p>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : flaggedReviews.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Flag className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60">No flagged reviews</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {flaggedReviews.map(rev => (
                                                <div key={rev.id} className="border border-error/30 bg-error/5 rounded-xl p-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold">{rev.authorName}</span>
                                                                <span className="badge badge-error badge-sm">Flagged</span>
                                                                {rev.isVerifiedVisit ? (
                                                                    <span className="badge badge-success badge-sm gap-1"><ShieldCheck className="w-3 h-3" /> Verified Visit</span>
                                                                ) : (
                                                                    <span className="badge badge-ghost badge-sm">Unverified</span>
                                                                )}
                                                                <span className="text-sm">{"★".repeat(Math.round(rev.ratingOverall || rev.rating))}</span>
                                                            </div>
                                                            <p className="text-sm text-base-content/70">Hospital: {rev.hospital?.name ?? "—"}</p>
                                                            {rev.flagReason && <p className="text-sm text-error font-medium">Reason: {rev.flagReason}</p>}
                                                            {rev.ipAddress && <p className="text-xs text-base-content/40">IP: {rev.ipAddress}</p>}
                                                            {rev.comment && <p className="text-sm mt-1 line-clamp-3">{rev.comment}</p>}
                                                        </div>
                                                        <div className="flex gap-2 shrink-0">
                                                            <button className="btn btn-success btn-sm" disabled={updating === rev.id} onClick={() => handleUnflagReview(rev.id)}>
                                                                <CheckCircle className="w-4 h-4" /> Unflag
                                                            </button>
                                                            <button className="btn btn-error btn-sm" disabled={updating === rev.id} onClick={() => handleDeleteReview(rev.id)}>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
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
