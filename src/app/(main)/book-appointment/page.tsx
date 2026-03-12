"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Clock, User, Phone, Mail, Hospital, Stethoscope, ChevronRight, CheckCircle, ShieldAlert } from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

type Hospital = { id: string; name: string; city: string; state: string; type: string; doctors: Doctor[]; prices: Price[] };
type Doctor = { id: string; name: string; specialty: string; consultationFee: number; availableDays: string; availableFrom: string; availableTo: string };
type Price = { id: string; category: string; name: string; priceMin: number; priceMax: number };

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

function BookAppointmentForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedId = searchParams.get("hospital");
    const { data: session, isPending } = useSession();
    const userRole = (session?.user as any)?.role ?? "user";

    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        hospitalId: preselectedId || "",
        doctorId: "",
        procedure: "",
        appointmentDate: "",
        appointmentTime: "",
        patientName: "",
        patientPhone: "",
        patientEmail: "",
        notes: "",
    });
    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    useEffect(() => {
        fetch("/api/registered-hospitals")
            .then(r => r.json())
            .then(d => {
                setHospitals(d.hospitals || []);
                if (preselectedId) {
                    const h = (d.hospitals || []).find((h: Hospital) => h.id === preselectedId);
                    if (h) { setSelectedHospital(h); setForm(p => ({ ...p, hospitalId: h.id })); }
                }
            });
    }, [preselectedId]);

    const selectHospital = (id: string) => {
        const h = hospitals.find(h => h.id === id);
        setSelectedHospital(h || null);
        set("hospitalId", id);
        set("doctorId", "");
        set("procedure", "");
    };

    const estimatedCost = () => {
        if (!form.procedure || !selectedHospital) return null;
        const p = selectedHospital.prices.find(p => p.name.toLowerCase().includes(form.procedure.toLowerCase()));
        return p ? `₹${p.priceMin.toLocaleString()} – ₹${p.priceMax.toLocaleString()}` : null;
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Booking failed");
            setSuccess(true);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    if (success) return (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-center">Appointment Confirmed!</h2>
            <p className="text-base-content/60 text-center max-w-sm">
                Your appointment at <strong>{selectedHospital?.name}</strong> has been booked. You will receive a confirmation shortly.
            </p>
            <div className="flex gap-3">
                <button className="btn btn-primary" onClick={() => router.push("/")}>Go Home</button>
                <button className="btn btn-outline" onClick={() => { setSuccess(false); setStep(1); setForm(p => ({ ...p, appointmentDate: "", appointmentTime: "", notes: "" })); }}>
                    Book Another
                </button>
            </div>
        </div>
    );

    if (isPending) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg" /></div>;

    if (!session?.user) return (
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
            <ShieldAlert className="w-16 h-16 text-warning mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-base-content/60 mb-6">You must be logged in to book an appointment.</p>
            <Link href="/auth/login?redirect=/book-appointment" className="btn btn-primary">Log In</Link>
        </div>
    );

    if (userRole !== "user") return (
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
            <ShieldAlert className="w-16 h-16 text-error mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Patients Only</h2>
            <p className="text-base-content/60 mb-6">
                Only patients can book appointments. {userRole === "doctor" ? "Doctors manage appointments from their dashboard." : "Admins manage appointments from the admin dashboard."}
            </p>
            <Link href={userRole === "admin" ? "/admin/dashboard" : "/providers/dashboard"} className="btn btn-primary">Go to Dashboard</Link>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Book an Appointment</h1>
                <p className="text-base-content/60">Schedule a visit at a registered hospital</p>
            </div>

            {/* Steps */}
            <ul className="steps steps-horizontal w-full mb-8">
                {["Select Hospital", "Pick Date & Time", "Your Details"].map((s, i) => (
                    <li key={i} className={`step ${step > i ? "step-primary" : ""}`}>{s}</li>
                ))}
            </ul>

            {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">

                    {/* STEP 1 — Hospital & Doctor */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><Hospital className="w-5 h-5 text-primary" /> Select Hospital & Service</h3>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-medium">Hospital *</span></label>
                                <select className="select select-bordered" value={form.hospitalId} onChange={e => selectHospital(e.target.value)}>
                                    <option value="">— Choose a hospital —</option>
                                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} ({h.city})</option>)}
                                </select>
                            </div>
                            {selectedHospital && (
                                <>
                                    {selectedHospital.doctors.length > 0 && (
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Doctor (optional – auto-assigned if blank)</span></label>
                                            <select className="select select-bordered" value={form.doctorId} onChange={e => set("doctorId", e.target.value)}>
                                                <option value="">Auto-assign best available doctor</option>
                                                {selectedHospital.doctors.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name} – {d.specialty} (₹{d.consultationFee})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-medium">Procedure / Reason *</span></label>
                                        {selectedHospital.prices.length > 0 ? (
                                            <select className="select select-bordered" value={form.procedure} onChange={e => set("procedure", e.target.value)}>
                                                <option value="">— Select procedure —</option>
                                                {selectedHospital.prices.map(p => (
                                                    <option key={p.id} value={p.name}>{p.name} (₹{p.priceMin}–₹{p.priceMax})</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input className="input input-bordered" placeholder="e.g. General Consultation, Blood Test" value={form.procedure} onChange={e => set("procedure", e.target.value)} />
                                        )}
                                    </div>
                                    {estimatedCost() && (
                                        <div className="alert alert-info py-2 text-sm">
                                            <span>Estimated cost: <strong>{estimatedCost()}</strong></span>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="card-actions justify-end">
                                <button className="btn btn-primary" disabled={!form.hospitalId || !form.procedure} onClick={() => setStep(2)}>
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 — Date & Time */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Pick Date & Time</h3>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-medium">Appointment Date *</span></label>
                                <input type="date" className="input input-bordered" min={new Date().toISOString().split("T")[0]} value={form.appointmentDate} onChange={e => set("appointmentDate", e.target.value)} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-medium">Preferred Time *</span></label>
                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                    {TIME_SLOTS.map(t => (
                                        <button key={t} type="button" className={`btn btn-sm ${form.appointmentTime === t ? "btn-primary" : "btn-outline"}`} onClick={() => set("appointmentTime", t)}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-medium">Additional Notes</span></label>
                                <textarea className="textarea textarea-bordered" rows={2} placeholder="Any symptoms, prior conditions, or special requests..." value={form.notes} onChange={e => set("notes", e.target.value)} />
                            </div>
                            <div className="card-actions justify-between">
                                <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                                <button className="btn btn-primary" disabled={!form.appointmentDate || !form.appointmentTime} onClick={() => setStep(3)}>
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 — Patient Details & Confirm */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Your Details</h3>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-medium">Full Name *</span></label>
                                <input className="input input-bordered" placeholder="Your full name" value={form.patientName} onChange={e => set("patientName", e.target.value)} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> Phone *</span></label>
                                    <input type="tel" className="input input-bordered" placeholder="+91 98765 43210" value={form.patientPhone} onChange={e => set("patientPhone", e.target.value)} />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-medium flex items-center gap-1"><Mail className="w-3 h-3" /> Email *</span></label>
                                    <input type="email" className="input input-bordered" placeholder="you@example.com" value={form.patientEmail} onChange={e => set("patientEmail", e.target.value)} />
                                </div>
                            </div>

                            {/* Summary box */}
                            <div className="bg-base-200 rounded-xl p-4 text-sm space-y-2 mt-2">
                                <h4 className="font-semibold">Booking Summary</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    <div><span className="text-base-content/60">Hospital:</span><p className="font-medium">{selectedHospital?.name}</p></div>
                                    <div><span className="text-base-content/60">Procedure:</span><p className="font-medium">{form.procedure}</p></div>
                                    <div><span className="text-base-content/60">Date:</span><p className="font-medium">{new Date(form.appointmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div>
                                    <div><span className="text-base-content/60">Time:</span><p className="font-medium">{form.appointmentTime}</p></div>
                                    {estimatedCost() && <div className="col-span-2"><span className="text-base-content/60">Est. Cost:</span><p className="font-medium text-success">{estimatedCost()}</p></div>}
                                </div>
                            </div>

                            <div className="card-actions justify-between">
                                <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
                                <button className="btn btn-success" disabled={!form.patientName || !form.patientPhone || !form.patientEmail || submitting} onClick={handleSubmit}>
                                    {submitting ? <span className="loading loading-spinner loading-sm" /> : <><CheckCircle className="w-4 h-4" /> Confirm Booking</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BookAppointmentPage() {
    return (
        <div className="min-h-screen bg-base-200">
            <Breadcrumb />
            <Suspense fallback={<div className="flex justify-center py-24"><span className="loading loading-spinner loading-lg" /></div>}>
                <BookAppointmentForm />
            </Suspense>
        </div>
    );
}
