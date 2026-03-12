"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Calendar, Building2, CheckCircle, XCircle, Clock, LogOut, UserCheck, Mail, Search, PlusCircle, FileText } from "lucide-react";
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

interface DoctorInvite {
    id: string;
    name: string;
    email: string | null;
    specialty: string;
    qualification: string;
    acceptedByDoctor: boolean;
    hospital: { id: string; name: string; city: string; state: string } | null;
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
    const [invites, setInvites] = useState<DoctorInvite[]>([]);
    const [inviteUpdating, setInviteUpdating] = useState<string | null>(null);
    // Join hospital request
    const [allHospitals, setAllHospitals] = useState<{ id: string; name: string; city: string; state: string }[]>([]);
    const [joinSearch, setJoinSearch] = useState("");
    const [joinForm, setJoinForm] = useState({ hospitalId: "", name: "", email: "", phone: "", qualification: "", specialty: "", medicalRegNo: "", documentUrl: "" });
    const [joinSubmitting, setJoinSubmitting] = useState(false);
    const [joinResult, setJoinResult] = useState("");

    useEffect(() => {
        if (!isPending && !session?.user) router.push("/auth/login");
    }, [session, isPending, router]);

    useEffect(() => {
        if (!session?.user) return;
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [apptRes, hospRes, invRes, allHospRes] = await Promise.all([
                    fetch("/api/doctor/appointments").then(r => r.json()).catch(() => ({ appointments: [] })),
                    fetch("/api/registered-hospitals/mine").then(r => r.json()).catch(() => ({ hospitals: [] })),
                    fetch("/api/doctor/invites").then(r => r.json()).catch(() => ({ invites: [] })),
                    fetch("/api/registered-hospitals").then(r => r.json()).catch(() => ({ hospitals: [] })),
                ]);
                setAppointments(apptRes.appointments || []);
                setHospitals(hospRes.hospitals || []);
                setInvites((invRes.invites || []).filter((i: DoctorInvite) => !i.acceptedByDoctor));
                setAllHospitals(allHospRes.hospitals || []);
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

    const handleInvite = async (doctorId: string, accept: boolean) => {
        setInviteUpdating(doctorId);
        try {
            const res = await fetch(`/api/doctor/invites/${doctorId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accept }),
            });
            if (res.ok) setInvites(prev => prev.filter(i => i.id !== doctorId));
        } finally {
            setInviteUpdating(null);
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
                                        <span className="badge badge-secondary badge-sm mt-1">Doctor</span>
                                    </div>
                                </div>
                                <ul className="menu p-0 gap-1">
                                    {[
                                        { id: "appointments", label: "Appointments", icon: Calendar },
                                        { id: "invites", label: "Invites", icon: Mail, badge: invites.length },
                                        { id: "join-hospital", label: "Join Hospital", icon: PlusCircle },
                                        { id: "hospitals", label: "My Hospitals", icon: Building2 },
                                    ].map(tab => (
                                        <li key={tab.id}>
                                            <button className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
                                                <tab.icon className="w-4 h-4" /> {tab.label}
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
                                            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("join-hospital")}>Join a Hospital</button>
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

                        {/* Invites Tab (3-way handshake) */}
                        {activeTab === "invites" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><Mail className="w-5 h-5" /> Hospital Invitations</h3>
                                    <p className="text-sm text-base-content/60 mb-2">Pending invitations from hospital administrators or approved requests. Accept to be listed as a doctor at the hospital.</p>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : invites.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Mail className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60">No pending invitations</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {invites.map(inv => (
                                                <div key={inv.id} className="border border-base-300 rounded-xl p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold">{inv.hospital?.name ?? "Hospital"}</span>
                                                                <span className="badge badge-warning badge-sm">Pending</span>
                                                            </div>
                                                            <p className="text-sm text-base-content/60">{inv.hospital?.city}, {inv.hospital?.state}</p>
                                                            <p className="text-sm">Role: <span className="font-medium">{inv.specialty}</span> &bull; {inv.qualification}</p>
                                                        </div>
                                                        <div className="flex gap-2 shrink-0">
                                                            <button className="btn btn-success btn-sm gap-1" disabled={inviteUpdating === inv.id} onClick={() => handleInvite(inv.id, true)}>
                                                                <UserCheck className="w-4 h-4" /> Accept
                                                            </button>
                                                            <button className="btn btn-error btn-sm" disabled={inviteUpdating === inv.id} onClick={() => handleInvite(inv.id, false)}>
                                                                Decline
                                                            </button>
                                                            {inviteUpdating === inv.id && <span className="loading loading-spinner loading-sm" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Join Hospital Tab */}
                        {activeTab === "join-hospital" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><PlusCircle className="w-5 h-5" /> Request to Join a Hospital</h3>
                                    <p className="text-sm text-base-content/60 mb-3">Search for a hospital and submit a request. The admin will review your credentials.</p>

                                    {/* Hospital search + select */}
                                    <label className="input input-bordered input-sm flex items-center gap-2 mb-2">
                                        <Search className="w-4 h-4 opacity-50" />
                                        <input type="text" placeholder="Search hospitals…" value={joinSearch} onChange={e => setJoinSearch(e.target.value)} className="grow" />
                                    </label>
                                    {joinSearch && (
                                        <div className="max-h-40 overflow-y-auto border border-base-300 rounded-lg mb-3">
                                            {allHospitals
                                                .filter(h => h.name.toLowerCase().includes(joinSearch.toLowerCase()) || h.city.toLowerCase().includes(joinSearch.toLowerCase()))
                                                .slice(0, 10)
                                                .map(h => (
                                                    <button
                                                        key={h.id}
                                                        type="button"
                                                        className={`w-full text-left px-3 py-2 hover:bg-base-200 text-sm ${joinForm.hospitalId === h.id ? "bg-primary/10 font-medium" : ""}`}
                                                        onClick={() => { setJoinForm(f => ({ ...f, hospitalId: h.id })); setJoinSearch(h.name); }}
                                                    >
                                                        {h.name} — {h.city}, {h.state}
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                    {joinForm.hospitalId && (
                                        <div className="badge badge-primary badge-sm mb-3">Selected: {allHospitals.find(h => h.id === joinForm.hospitalId)?.name}</div>
                                    )}

                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (!joinForm.hospitalId) return;
                                        setJoinSubmitting(true);
                                        setJoinResult("");
                                        try {
                                            const res = await fetch("/api/doctor-requests", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify(joinForm),
                                            });
                                            const data = await res.json();
                                            if (res.ok) {
                                                setJoinResult("Request submitted! The hospital admin will review your application.");
                                                setJoinForm({ hospitalId: "", name: "", email: "", phone: "", qualification: "", specialty: "", medicalRegNo: "", documentUrl: "" });
                                                setJoinSearch("");
                                            } else {
                                                setJoinResult(data.error || "Failed to submit request.");
                                            }
                                        } catch {
                                            setJoinResult("Network error. Please try again.");
                                        } finally {
                                            setJoinSubmitting(false);
                                        }
                                    }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {([
                                            { key: "name", label: "Full Name *", placeholder: "Dr. Amit Sharma", type: "text", required: true },
                                            { key: "email", label: "Email *", placeholder: "doctor@example.com", type: "email", required: true },
                                            { key: "phone", label: "Phone", placeholder: "+91 9999988888", type: "text", required: false },
                                            { key: "qualification", label: "Qualification *", placeholder: "MBBS, MD", type: "text", required: true },
                                            { key: "specialty", label: "Specialty *", placeholder: "Cardiology", type: "text", required: true },
                                            { key: "medicalRegNo", label: "Medical Registration No. *", placeholder: "MH/2020/12345", type: "text", required: true },
                                            { key: "documentUrl", label: "ID Document URL", placeholder: "https://drive.google.com/...", type: "url", required: false },
                                        ] as const).map(f => (
                                            <div key={f.key} className="form-control">
                                                <label className="label"><span className="label-text">{f.label}</span></label>
                                                <input type={f.type} required={f.required} className="input input-bordered" placeholder={f.placeholder} value={joinForm[f.key]} onChange={e => setJoinForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                                            </div>
                                        ))}
                                        <div className="sm:col-span-2 flex items-center gap-4 mt-2">
                                            <button type="submit" className="btn btn-primary" disabled={!joinForm.hospitalId || !joinForm.name || !joinForm.medicalRegNo || joinSubmitting}>
                                                <FileText className="w-4 h-4" /> Submit Request
                                            </button>
                                            {joinSubmitting && <span className="loading loading-spinner loading-sm" />}
                                        </div>
                                    </form>
                                    {joinResult && (
                                        <div className={`alert mt-4 ${joinResult.startsWith("Request submitted") ? "alert-success" : "alert-error"}`}>{joinResult}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "hospitals" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title"><Building2 className="w-5 h-5" /> My Hospitals</h3>
                                    <p className="text-sm text-base-content/60 mb-2">Hospitals where you are listed as a doctor.</p>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : hospitals.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Building2 className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60 mb-4">You are not associated with any hospital yet</p>
                                            <button className="btn btn-primary" onClick={() => setActiveTab("join-hospital")}>Request to Join</button>
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
