"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Hospital, Building2, CheckCircle, ArrowRight, BadgeCheck, Clock, TrendingUp, Users, MapPin,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";

const HOSPITAL_TYPES = ["General", "Speciality", "Super Speciality", "Multi-speciality", "Clinic", "Diagnostic Centre", "Nursing Home"];
const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Chandigarh","Puducherry"];

export default function ProviderRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "", registrationNumber: "", type: "General",
        address: "", city: "", state: "", pincode: "",
        latitude: "", longitude: "",
        phone: "", email: "", website: "", description: "",
    });

    const set = (k: string, v: string) => setFormData(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/registered-hospitals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Registration failed");
            router.push("/providers/dashboard?registered=1");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
            setSubmitting(false);
        }
    };

    const benefits = [
        { icon: Users, title: "Reach More Patients", desc: "Get discovered by thousands of patients looking for healthcare services" },
        { icon: TrendingUp, title: "Increase Visibility", desc: "Showcase your services, prices, and patient reviews" },
        { icon: BadgeCheck, title: "Build Trust", desc: "Verified badge helps patients trust your hospital" },
        { icon: Clock, title: "Save Time", desc: "Reduce inquiry calls with transparent pricing information" },
    ];

    const steps = [
        { num: 1, title: "Basic Info" },
        { num: 2, title: "Location & Contact" },
        { num: 3, title: "Review & Submit" },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            <Breadcrumb />

            {/* Hero */}
            <section className="bg-gradient-to-br from-primary/10 via-base-100 to-accent/10 py-16">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                        <Hospital className="w-5 h-5" />
                        <span className="font-medium">For Healthcare Providers</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Partner with MedMap</h1>
                    <p className="text-lg text-base-content/70 mb-8">
                        Join India's leading healthcare price transparency platform. List your hospital and reach millions of patients.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="#register" className="btn btn-primary btn-lg">
                            Register Your Hospital <ArrowRight className="w-5 h-5" />
                        </a>
                        <Link href="/providers/dashboard" className="btn btn-outline btn-lg">
                            Already Registered? Dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-12 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {benefits.map((b, i) => (
                            <div key={i} className="card bg-base-200">
                                <div className="card-body items-center text-center">
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                        <b.icon className="w-7 h-7 text-primary" />
                                    </div>
                                    <h3 className="card-title text-base">{b.title}</h3>
                                    <p className="text-sm text-base-content/60">{b.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Registration Form */}
            <section id="register" className="py-16">
                <div className="container mx-auto px-4 max-w-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-2">Register Your Hospital</h2>
                        <p className="text-base-content/60">Complete in 3 simple steps</p>
                    </div>

                    <ul className="steps steps-horizontal w-full mb-8">
                        {steps.map(s => (
                            <li key={s.num} className={`step ${step >= s.num ? "step-primary" : ""}`}>{s.title}</li>
                        ))}
                    </ul>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body gap-4">

                            {/* STEP 1 — Basic Info */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold">Hospital Information</h3>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-medium">Hospital Name *</span></label>
                                        <input type="text" placeholder="e.g. Apollo Hospitals" className="input input-bordered" value={formData.name} onChange={e => set("name", e.target.value)} />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Registration Number</span></label>
                                            <input type="text" placeholder="Reg. number (optional)" className="input input-bordered" value={formData.registrationNumber} onChange={e => set("registrationNumber", e.target.value)} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Hospital Type *</span></label>
                                            <select className="select select-bordered" value={formData.type} onChange={e => set("type", e.target.value)}>
                                                {HOSPITAL_TYPES.map(t => <option key={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-medium">Description</span></label>
                                        <textarea className="textarea textarea-bordered" rows={3} placeholder="Brief description of your hospital and services" value={formData.description} onChange={e => set("description", e.target.value)} />
                                    </div>
                                    <div className="card-actions justify-end mt-2">
                                        <button className="btn btn-primary" disabled={!formData.name} onClick={() => setStep(2)}>
                                            Continue <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2 — Location & Contact */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold">Location & Contact</h3>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-medium">Full Address *</span></label>
                                        <textarea className="textarea textarea-bordered" rows={2} placeholder="Street / Building / Area" value={formData.address} onChange={e => set("address", e.target.value)} />
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">City *</span></label>
                                            <input type="text" placeholder="e.g. Mumbai" className="input input-bordered" value={formData.city} onChange={e => set("city", e.target.value)} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">State *</span></label>
                                            <select className="select select-bordered" value={formData.state} onChange={e => set("state", e.target.value)}>
                                                <option value="">Select state</option>
                                                {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Pincode *</span></label>
                                            <input type="text" placeholder="6-digit pincode" maxLength={6} className="input input-bordered" value={formData.pincode} onChange={e => set("pincode", e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Latitude</span></label>
                                            <input type="number" step="0.000001" placeholder="e.g. 19.0760" className="input input-bordered" value={formData.latitude} onChange={e => set("latitude", e.target.value)} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Longitude</span></label>
                                            <input type="number" step="0.000001" placeholder="e.g. 72.8777" className="input input-bordered" value={formData.longitude} onChange={e => set("longitude", e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="alert alert-info py-2 text-sm">
                                        <MapPin className="w-4 h-4 shrink-0" />
                                        <span>Find coordinates at <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer" className="link">latlong.net</a></span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Phone *</span></label>
                                            <input type="tel" placeholder="+91 98765 43210" className="input input-bordered" value={formData.phone} onChange={e => set("phone", e.target.value)} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Email *</span></label>
                                            <input type="email" placeholder="info@hospital.com" className="input input-bordered" value={formData.email} onChange={e => set("email", e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-medium">Website</span></label>
                                        <input type="url" placeholder="https://www.hospital.com (optional)" className="input input-bordered" value={formData.website} onChange={e => set("website", e.target.value)} />
                                    </div>
                                    <div className="card-actions justify-between mt-2">
                                        <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                                        <button className="btn btn-primary" disabled={!formData.address || !formData.city || !formData.state || !formData.pincode || !formData.phone || !formData.email} onClick={() => setStep(3)}>
                                            Continue <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3 — Review & Submit */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-success" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-1">Review Your Information</h3>
                                        <p className="text-base-content/60 text-sm">Please verify before submitting</p>
                                    </div>
                                    <div className="bg-base-200 rounded-xl p-5 space-y-3 text-sm">
                                        <h4 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> Hospital Details</h4>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            <div><span className="text-base-content/60">Name:</span><p className="font-medium">{formData.name}</p></div>
                                            <div><span className="text-base-content/60">Type:</span><p className="font-medium">{formData.type}</p></div>
                                            <div><span className="text-base-content/60">Address:</span><p className="font-medium">{formData.address}</p></div>
                                            <div><span className="text-base-content/60">City / State:</span><p className="font-medium">{formData.city}, {formData.state} – {formData.pincode}</p></div>
                                            <div><span className="text-base-content/60">Phone:</span><p className="font-medium">{formData.phone}</p></div>
                                            <div><span className="text-base-content/60">Email:</span><p className="font-medium">{formData.email}</p></div>
                                        </div>
                                    </div>
                                    <div className="card-actions justify-between mt-2">
                                        <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
                                        <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
                                            {submitting ? <span className="loading loading-spinner loading-sm" /> : <><CheckCircle className="w-4 h-4" /> Submit Registration</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
