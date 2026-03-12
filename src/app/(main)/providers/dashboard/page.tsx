"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Building2, Users, DollarSign, Calendar, Plus, Trash2, Edit, CheckCircle, XCircle,
    Clock, RefreshCw, Hospital, ChevronDown,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";

type Hospital = {
    id: string; name: string; city: string; state: string; type: string; isVerified: boolean; isActive: boolean;
    _count?: { doctors: number; appointments: number; prices: number };
};
type Doctor = {
    id: string; name: string; qualification: string; specialty: string; subSpecialty?: string;
    experienceYears: number; consultationFee: number; availableDays: string; availableFrom: string; availableTo: string;
};
type Price = { id: string; category: string; name: string; priceMin: number; priceMax: number; description?: string };
type Appointment = {
    id: string; patientName: string; patientPhone: string; procedure: string;
    appointmentDate: string; appointmentTime: string; status: string;
    doctor?: { name: string; specialty: string };
};

const STATUS_COLORS: Record<string, string> = {
    confirmed: "badge-success",
    pending: "badge-warning",
    cancelled: "badge-error",
    completed: "badge-neutral",
};

export default function ProviderDashboard() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
    const [tab, setTab] = useState<"doctors" | "prices" | "appointments">("appointments");
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [prices, setPrices] = useState<Price[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDoctorForm, setShowDoctorForm] = useState(false);
    const [showPriceForm, setShowPriceForm] = useState(false);
    const [doctorForm, setDoctorForm] = useState({ name: "", qualification: "", specialty: "", subSpecialty: "", experienceYears: "0", consultationFee: "500", availableDays: "Mon,Tue,Wed,Thu,Fri", availableFrom: "09:00", availableTo: "17:00", maxSlotsPerDay: "20", phone: "" });
    const [priceForm, setPriceForm] = useState({ category: "Consultation", name: "", description: "", priceMin: "", priceMax: "" });

    useEffect(() => {
        fetch("/api/registered-hospitals/mine")
            .then(r => r.json())
            .then(d => { setHospitals(d.hospitals || []); if (d.hospitals?.length) setSelectedHospital(d.hospitals[0]); })
            .finally(() => setLoading(false));
    }, []);

    const loadTab = useCallback(async (h: Hospital, t: typeof tab) => {
        if (t === "doctors") {
            const r = await fetch(`/api/registered-hospitals/${h.id}/doctors`);
            const d = await r.json();
            setDoctors(d.doctors || []);
        } else if (t === "prices") {
            const r = await fetch(`/api/registered-hospitals/${h.id}/prices`);
            const d = await r.json();
            setPrices(d.prices || []);
        } else {
            const r = await fetch(`/api/registered-hospitals/${h.id}/appointments`);
            const d = await r.json();
            setAppointments(d.appointments || []);
        }
    }, []);

    useEffect(() => {
        if (selectedHospital) loadTab(selectedHospital, tab);
    }, [selectedHospital, tab, loadTab]);

    const addDoctor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHospital) return;
        const res = await fetch(`/api/registered-hospitals/${selectedHospital.id}/doctors`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(doctorForm),
        });
        if (res.ok) { setShowDoctorForm(false); loadTab(selectedHospital, "doctors"); setDoctorForm({ name: "", qualification: "", specialty: "", subSpecialty: "", experienceYears: "0", consultationFee: "500", availableDays: "Mon,Tue,Wed,Thu,Fri", availableFrom: "09:00", availableTo: "17:00", maxSlotsPerDay: "20", phone: "" }); }
    };

    const removeDoctor = async (doctorId: string) => {
        if (!selectedHospital || !confirm("Remove this doctor?")) return;
        await fetch(`/api/registered-hospitals/${selectedHospital.id}/doctors/${doctorId}`, { method: "DELETE" });
        loadTab(selectedHospital, "doctors");
    };

    const addPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHospital) return;
        const res = await fetch(`/api/registered-hospitals/${selectedHospital.id}/prices`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(priceForm),
        });
        if (res.ok) { setShowPriceForm(false); loadTab(selectedHospital, "prices"); setPriceForm({ category: "Consultation", name: "", description: "", priceMin: "", priceMax: "" }); }
    };

    const removePrice = async (priceId: string) => {
        if (!selectedHospital || !confirm("Remove this price?")) return;
        await fetch(`/api/registered-hospitals/${selectedHospital.id}/prices/${priceId}`, { method: "DELETE" });
        loadTab(selectedHospital, "prices");
    };

    const updateStatus = async (appointmentId: string, status: string) => {
        await fetch(`/api/appointments/${appointmentId}/status`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
        });
        if (selectedHospital) loadTab(selectedHospital, "appointments");
    };

    if (loading) return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center">
            <span className="loading loading-spinner loading-lg" />
        </div>
    );

    if (!hospitals.length) return (
        <div className="min-h-screen bg-base-200">
            <Breadcrumb />
            <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Hospital className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">No Hospitals Yet</h2>
                <p className="text-base-content/60">Register your hospital to start managing appointments</p>
                <Link href="/providers/register" className="btn btn-primary">
                    <Plus className="w-4 h-4" /> Register Hospital
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-base-200">
            <Breadcrumb />
            <div className="container mx-auto px-4 py-8 max-w-6xl">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Provider Dashboard</h1>
                        <p className="text-base-content/60 text-sm">Manage your hospital, staff and appointments</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Hospital selector */}
                        <div className="dropdown dropdown-end">
                            <button className="btn btn-outline gap-2">
                                <Building2 className="w-4 h-4" />
                                {selectedHospital?.name}
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <ul className="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-64">
                                {hospitals.map(h => (
                                    <li key={h.id}><button onClick={() => setSelectedHospital(h)} className={selectedHospital?.id === h.id ? "active" : ""}>{h.name}</button></li>
                                ))}
                                <li><Link href="/providers/register"><Plus className="w-3 h-3" /> Add Hospital</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {selectedHospital && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { icon: Users, label: "Doctors", val: selectedHospital._count?.doctors ?? 0, color: "text-primary" },
                                { icon: Calendar, label: "Appointments", val: selectedHospital._count?.appointments ?? 0, color: "text-success" },
                                { icon: DollarSign, label: "Price Items", val: selectedHospital._count?.prices ?? 0, color: "text-warning" },
                                { icon: CheckCircle, label: "Status", val: selectedHospital.isVerified ? "Verified" : "Pending", color: selectedHospital.isVerified ? "text-success" : "text-warning" },
                            ].map((s, i) => (
                                <div key={i} className="card bg-base-100 shadow-sm">
                                    <div className="card-body p-4 flex-row items-center gap-3">
                                        <s.icon className={`w-8 h-8 ${s.color}`} />
                                        <div>
                                            <p className="text-xs text-base-content/60">{s.label}</p>
                                            <p className="text-xl font-bold">{s.val}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body p-0">
                                <div className="tabs tabs-boxed bg-base-200 m-4 mb-0">
                                    {(["appointments", "doctors", "prices"] as const).map(t => (
                                        <button key={t} className={`tab capitalize ${tab === t ? "tab-active" : ""}`} onClick={() => setTab(t)}>
                                            {t === "appointments" && <Calendar className="w-4 h-4 mr-1" />}
                                            {t === "doctors" && <Users className="w-4 h-4 mr-1" />}
                                            {t === "prices" && <DollarSign className="w-4 h-4 mr-1" />}
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4">

                                    {/*  APPOINTMENTS TAB  */}
                                    {tab === "appointments" && (
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-semibold text-lg">Appointments</h3>
                                                <button className="btn btn-sm btn-ghost" onClick={() => loadTab(selectedHospital, "appointments")}>
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {appointments.length === 0 ? (
                                                <div className="text-center py-12 text-base-content/40">
                                                    <Calendar className="w-12 h-12 mx-auto mb-3" />
                                                    <p>No appointments yet</p>
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="table table-sm">
                                                        <thead>
                                                            <tr><th>Patient</th><th>Procedure</th><th>Date & Time</th><th>Doctor</th><th>Status</th><th>Actions</th></tr>
                                                        </thead>
                                                        <tbody>
                                                            {appointments.map(a => (
                                                                <tr key={a.id}>
                                                                    <td>
                                                                        <p className="font-medium">{a.patientName}</p>
                                                                        <p className="text-xs text-base-content/60">{a.patientPhone}</p>
                                                                    </td>
                                                                    <td>{a.procedure}</td>
                                                                    <td>
                                                                        <p>{new Date(a.appointmentDate).toLocaleDateString("en-IN")}</p>
                                                                        <p className="text-xs text-base-content/60">{a.appointmentTime}</p>
                                                                    </td>
                                                                    <td>{a.doctor?.name || <span className="text-base-content/40">Unassigned</span>}</td>
                                                                    <td><span className={`badge badge-sm ${STATUS_COLORS[a.status] || ""}`}>{a.status}</span></td>
                                                                    <td>
                                                                        <div className="flex gap-1">
                                                                            {a.status === "pending" && <button className="btn btn-xs btn-success" onClick={() => updateStatus(a.id, "confirmed")}><CheckCircle className="w-3 h-3" /></button>}
                                                                            {a.status !== "completed" && a.status !== "cancelled" && (
                                                                                <>
                                                                                    <button className="btn btn-xs btn-neutral" onClick={() => updateStatus(a.id, "completed")}><Clock className="w-3 h-3" /></button>
                                                                                    <button className="btn btn-xs btn-error" onClick={() => updateStatus(a.id, "cancelled")}><XCircle className="w-3 h-3" /></button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/*  DOCTORS TAB  */}
                                    {tab === "doctors" && (
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-semibold text-lg">Medical Staff</h3>
                                                <button className="btn btn-sm btn-primary" onClick={() => setShowDoctorForm(!showDoctorForm)}>
                                                    <Plus className="w-4 h-4" /> Add Doctor
                                                </button>
                                            </div>

                                            {showDoctorForm && (
                                                <form onSubmit={addDoctor} className="card bg-base-200 mb-6">
                                                    <div className="card-body gap-3">
                                                        <h4 className="font-semibold">New Doctor</h4>
                                                        <div className="grid md:grid-cols-2 gap-3">
                                                            <input required placeholder="Full name *" className="input input-bordered input-sm" value={doctorForm.name} onChange={e => setDoctorForm(p => ({ ...p, name: e.target.value }))} />
                                                            <input required placeholder="Qualification (e.g. MBBS, MD) *" className="input input-bordered input-sm" value={doctorForm.qualification} onChange={e => setDoctorForm(p => ({ ...p, qualification: e.target.value }))} />
                                                            <input required placeholder="Specialty *" className="input input-bordered input-sm" value={doctorForm.specialty} onChange={e => setDoctorForm(p => ({ ...p, specialty: e.target.value }))} />
                                                            <input placeholder="Sub-specialty" className="input input-bordered input-sm" value={doctorForm.subSpecialty} onChange={e => setDoctorForm(p => ({ ...p, subSpecialty: e.target.value }))} />
                                                            <input type="number" placeholder="Experience (years)" className="input input-bordered input-sm" value={doctorForm.experienceYears} onChange={e => setDoctorForm(p => ({ ...p, experienceYears: e.target.value }))} />
                                                            <input type="number" placeholder="Consultation fee (₹)" className="input input-bordered input-sm" value={doctorForm.consultationFee} onChange={e => setDoctorForm(p => ({ ...p, consultationFee: e.target.value }))} />
                                                            <input placeholder="Available days (e.g. Mon,Tue,Wed)" className="input input-bordered input-sm" value={doctorForm.availableDays} onChange={e => setDoctorForm(p => ({ ...p, availableDays: e.target.value }))} />
                                                            <div className="flex gap-2">
                                                                <input type="time" className="input input-bordered input-sm flex-1" value={doctorForm.availableFrom} onChange={e => setDoctorForm(p => ({ ...p, availableFrom: e.target.value }))} />
                                                                <input type="time" className="input input-bordered input-sm flex-1" value={doctorForm.availableTo} onChange={e => setDoctorForm(p => ({ ...p, availableTo: e.target.value }))} />
                                                            </div>
                                                            <input type="number" placeholder="Max slots per day" className="input input-bordered input-sm" value={doctorForm.maxSlotsPerDay} onChange={e => setDoctorForm(p => ({ ...p, maxSlotsPerDay: e.target.value }))} />
                                                            <input placeholder="Doctor phone" className="input input-bordered input-sm" value={doctorForm.phone} onChange={e => setDoctorForm(p => ({ ...p, phone: e.target.value }))} />
                                                        </div>
                                                        <div className="flex gap-2 justify-end">
                                                            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowDoctorForm(false)}>Cancel</button>
                                                            <button type="submit" className="btn btn-sm btn-primary">Save Doctor</button>
                                                        </div>
                                                    </div>
                                                </form>
                                            )}

                                            {doctors.length === 0 ? (
                                                <div className="text-center py-12 text-base-content/40">
                                                    <Users className="w-12 h-12 mx-auto mb-3" />
                                                    <p>No doctors added yet</p>
                                                </div>
                                            ) : (
                                                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {doctors.map(d => (
                                                        <div key={d.id} className="card bg-base-200">
                                                            <div className="card-body p-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <h4 className="font-semibold">{d.name}</h4>
                                                                        <p className="text-sm text-base-content/60">{d.qualification}</p>
                                                                    </div>
                                                                    <button className="btn btn-xs btn-error btn-circle" onClick={() => removeDoctor(d.id)}><Trash2 className="w-3 h-3" /></button>
                                                                </div>
                                                                <div className="badge badge-primary badge-sm">{d.specialty}</div>
                                                                {d.subSpecialty && <div className="badge badge-outline badge-sm">{d.subSpecialty}</div>}
                                                                <div className="text-xs text-base-content/60 space-y-1 mt-1">
                                                                    <p>Exp: {d.experienceYears} years &nbsp;&nbsp; Fee: ₹{d.consultationFee}</p>
                                                                    <p>Days: {d.availableDays}</p>
                                                                    <p>Time: {d.availableFrom} – {d.availableTo}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/*  PRICES TAB  */}
                                    {tab === "prices" && (
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-semibold text-lg">Pricing</h3>
                                                <button className="btn btn-sm btn-primary" onClick={() => setShowPriceForm(!showPriceForm)}>
                                                    <Plus className="w-4 h-4" /> Add Price
                                                </button>
                                            </div>

                                            {showPriceForm && (
                                                <form onSubmit={addPrice} className="card bg-base-200 mb-6">
                                                    <div className="card-body gap-3">
                                                        <h4 className="font-semibold">New Price Item</h4>
                                                        <div className="grid md:grid-cols-2 gap-3">
                                                            <select className="select select-bordered select-sm" value={priceForm.category} onChange={e => setPriceForm(p => ({ ...p, category: e.target.value }))}>
                                                                {["Consultation", "Surgery", "Diagnostic", "Bed / ICU", "Maternity", "Pharmacy", "Other"].map(c => <option key={c}>{c}</option>)}
                                                            </select>
                                                            <input required placeholder="Procedure / Service name *" className="input input-bordered input-sm" value={priceForm.name} onChange={e => setPriceForm(p => ({ ...p, name: e.target.value }))} />
                                                            <input type="number" required placeholder="Min price (₹) *" className="input input-bordered input-sm" value={priceForm.priceMin} onChange={e => setPriceForm(p => ({ ...p, priceMin: e.target.value }))} />
                                                            <input type="number" required placeholder="Max price (₹) *" className="input input-bordered input-sm" value={priceForm.priceMax} onChange={e => setPriceForm(p => ({ ...p, priceMax: e.target.value }))} />
                                                            <input placeholder="Description (optional)" className="input input-bordered input-sm md:col-span-2" value={priceForm.description} onChange={e => setPriceForm(p => ({ ...p, description: e.target.value }))} />
                                                        </div>
                                                        <div className="flex gap-2 justify-end">
                                                            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowPriceForm(false)}>Cancel</button>
                                                            <button type="submit" className="btn btn-sm btn-primary">Save Price</button>
                                                        </div>
                                                    </div>
                                                </form>
                                            )}

                                            {prices.length === 0 ? (
                                                <div className="text-center py-12 text-base-content/40">
                                                    <DollarSign className="w-12 h-12 mx-auto mb-3" />
                                                    <p>No prices added yet</p>
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="table table-sm">
                                                        <thead>
                                                            <tr><th>Category</th><th>Service</th><th>Price Range</th><th>Description</th><th></th></tr>
                                                        </thead>
                                                        <tbody>
                                                            {prices.map(p => (
                                                                <tr key={p.id}>
                                                                    <td><span className="badge badge-outline badge-sm">{p.category}</span></td>
                                                                    <td className="font-medium">{p.name}</td>
                                                                    <td>₹{p.priceMin.toLocaleString()} – ₹{p.priceMax.toLocaleString()}</td>
                                                                    <td className="text-base-content/60 text-xs">{p.description || "—"}</td>
                                                                    <td><button className="btn btn-xs btn-error btn-circle" onClick={() => removePrice(p.id)}><Trash2 className="w-3 h-3" /></button></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
