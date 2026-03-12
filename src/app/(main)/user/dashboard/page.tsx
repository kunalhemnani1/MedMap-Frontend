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
    Star,
    ShieldCheck,
    MessageSquare,
    X,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { useSession, signOut } from "@/lib/auth-client";

interface Bookmark {
    id: string;
    hospitalId: number;
    note: string | null;
    createdAt: string;
}

interface Appointment {
    id: string;
    procedure: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    estimatedCost: number | null;
    patientName: string;
    hospital: { id: string; name: string; city: string; state: string; phone: string } | null;
    doctor: { id: string; name: string; specialty: string } | null;
}

interface ReviewToken {
    token: string;
    hospitalId: string;
    hospital?: { name: string };
    appointmentId: string;
}

const RATING_LABELS = ["Terrible", "Poor", "Average", "Good", "Excellent"];
const RATING_CATEGORIES = [
    { key: "ratingWaiting", label: "Waiting Time" },
    { key: "ratingCommunication", label: "Doctor Communication" },
    { key: "ratingStaff", label: "Staff Behavior" },
    { key: "ratingCleanliness", label: "Cleanliness" },
    { key: "ratingOverall", label: "Overall Experience" },
] as const;

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
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewTokens, setReviewTokens] = useState<ReviewToken[]>([]);
    const [reviewingAppt, setReviewingAppt] = useState<Appointment | null>(null);
    const [reviewForm, setReviewForm] = useState({
        authorName: "",
        comment: "",
        ratingWaiting: 0,
        ratingCommunication: 0,
        ratingStaff: 0,
        ratingCleanliness: 0,
        ratingOverall: 0,
    });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewResult, setReviewResult] = useState("");

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
                const [bkRes, apptRes] = await Promise.all([
                    fetch("/api/bookmarks").then((r) => r.json()).catch(() => ({ bookmarks: [] })),
                    fetch("/api/appointments").then((r) => r.json()).catch(() => ({ appointments: [] })),
                ]);
                setBookmarks(bkRes.bookmarks || []);
                const appts = apptRes.appointments || [];
                setAppointments(appts);

                // Fetch review tokens for completed appointments
                const completed = appts.filter((a: Appointment) => a.status === "completed");
                const tokenResults: ReviewToken[] = [];
                for (const appt of completed) {
                    if (!appt.hospital?.id) continue;
                    try {
                        const tokenRes = await fetch(`/api/review-token?hospitalId=${appt.hospital.id}`);
                        const data = await tokenRes.json();
                        if (data.token) tokenResults.push({ ...data.token, hospital: appt.hospital, appointmentId: appt.id });
                    } catch { /* skip */ }
                }
                setReviewTokens(tokenResults);
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

    const upcomingAppointments = appointments.filter((a) => a.status === "confirmed" || a.status === "pending");

    const openReviewForm = (appt: Appointment) => {
        setReviewingAppt(appt);
        setReviewForm({ authorName: user.name || "", comment: "", ratingWaiting: 0, ratingCommunication: 0, ratingStaff: 0, ratingCleanliness: 0, ratingOverall: 0 });
        setReviewResult("");
    };

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewingAppt?.hospital) return;
        const token = reviewTokens.find(t => t.hospitalId === reviewingAppt.hospital!.id);
        setReviewSubmitting(true);
        setReviewResult("");
        try {
            const res = await fetch(`/api/hospitals/${reviewingAppt.hospital.id}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...reviewForm,
                    reviewToken: token?.token || undefined,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setReviewResult("Review submitted! Thank you for your feedback.");
                setReviewTokens(prev => prev.filter(t => t.hospitalId !== reviewingAppt.hospital!.id));
                setTimeout(() => setReviewingAppt(null), 2000);
            } else {
                setReviewResult(data.error || "Failed to submit review.");
            }
        } catch {
            setReviewResult("Network error. Please try again.");
        } finally {
            setReviewSubmitting(false);
        }
    };

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
                                        <div className="stat-title">Appointments</div>
                                        <div className="stat-value text-secondary">{appointments.length}</div>
                                    </div>
                                    <div className="stat bg-base-100 rounded-xl shadow">
                                        <div className="stat-figure text-success"><TrendingDown className="w-8 h-8" /></div>
                                        <div className="stat-title">Upcoming</div>
                                        <div className="stat-value text-success">{upcomingAppointments.length}</div>
                                    </div>
                                </div>

                                {/* Pending Review Prompts */}
                                {reviewTokens.length > 0 && (
                                    <div className="card bg-base-100 shadow-lg border-l-4 border-success">
                                        <div className="card-body">
                                            <h3 className="card-title text-success"><MessageSquare className="w-5 h-5" /> Leave a Review</h3>
                                            <p className="text-sm text-base-content/60 mb-2">
                                                You have completed visits awaiting your feedback. Verified reviews help other patients!
                                            </p>
                                            <div className="space-y-2">
                                                {reviewTokens.map(token => {
                                                    const appt = appointments.find(a => a.id === token.appointmentId);
                                                    return (
                                                        <div key={token.token} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                                                            <div>
                                                                <p className="font-medium">{token.hospital?.name ?? "Hospital"}</p>
                                                                <p className="text-sm text-base-content/60">{appt?.procedure}</p>
                                                                <span className="badge badge-success badge-sm gap-1"><ShieldCheck className="w-3 h-3" /> Verified Visit</span>
                                                            </div>
                                                            <button className="btn btn-success btn-sm" onClick={() => appt && openReviewForm(appt)}>
                                                                <Star className="w-4 h-4" /> Rate Now
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {upcomingAppointments.length > 0 && (
                                    <div className="card bg-base-100 shadow-lg">
                                        <div className="card-body">
                                            <h3 className="card-title"><Calendar className="w-5 h-5" /> Upcoming Appointments</h3>
                                            <div className="space-y-3">
                                                {upcomingAppointments.slice(0, 3).map((a) => (
                                                    <div key={a.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                                                        <div>
                                                            <p className="font-medium">{a.procedure}</p>
                                                            <p className="text-sm text-base-content/60">
                                                                {a.hospital?.name}{a.doctor ? ` — Dr. ${a.doctor.name}` : ""}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium">{new Date(a.appointmentDate).toLocaleDateString("en-IN")}</p>
                                                            <p className="text-xs text-base-content/60">{a.appointmentTime}</p>
                                                            <span className={`badge badge-sm ${a.status === "confirmed" ? "badge-success" : "badge-warning"}`}>
                                                                {a.status}
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
                                    <h3 className="card-title"><ClipboardList className="w-5 h-5" /> Your Appointments</h3>
                                    {loading ? (
                                        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>
                                    ) : appointments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Calendar className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                                            <p className="text-base-content/60">No appointments yet</p>
                                            <Link href="/book-appointment" className="btn btn-primary mt-4">Book Now</Link>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Procedure</th>
                                                        <th>Hospital</th>
                                                        <th>Doctor</th>
                                                        <th>Date</th>
                                                        <th>Status</th>
                                                        <th>Cost</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {appointments.map((a) => (
                                                        <tr key={a.id}>
                                                            <td className="font-medium">{a.procedure}</td>
                                                            <td>{a.hospital?.name ?? "—"}<br /><span className="text-xs text-base-content/60">{a.hospital?.city}</span></td>
                                                            <td>{a.doctor ? `Dr. ${a.doctor.name}` : "—"}</td>
                                                            <td>{new Date(a.appointmentDate).toLocaleDateString("en-IN")}<br />
                                                                <span className="text-xs text-base-content/60">{a.appointmentTime}</span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge badge-sm ${a.status === "confirmed" ? "badge-success" :
                                                                    a.status === "cancelled" ? "badge-error" :
                                                                        a.status === "completed" ? "badge-info" : "badge-warning"
                                                                    }`}>{a.status}</span>
                                                            </td>
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

            {/* Review Modal */}
            {reviewingAppt && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="card bg-base-100 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <h3 className="card-title"><Star className="w-5 h-5 text-warning" /> Rate Your Visit</h3>
                                <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setReviewingAppt(null)}><X className="w-4 h-4" /></button>
                            </div>
                            <p className="text-sm text-base-content/60">{reviewingAppt.hospital?.name} — {reviewingAppt.procedure}</p>
                            {reviewTokens.find(t => t.hospitalId === reviewingAppt.hospital?.id) && (
                                <div className="badge badge-success gap-1 mt-1"><ShieldCheck className="w-3 h-3" /> Verified Visit — Your review will carry a verified badge</div>
                            )}
                            <form onSubmit={submitReview} className="space-y-4 mt-3">
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Your Name</span></label>
                                    <input type="text" required className="input input-bordered" value={reviewForm.authorName} onChange={e => setReviewForm(f => ({ ...f, authorName: e.target.value }))} />
                                </div>

                                {/* 5-category star ratings */}
                                <div className="space-y-3">
                                    {RATING_CATEGORIES.map(cat => (
                                        <div key={cat.key} className="form-control">
                                            <label className="label py-1"><span className="label-text font-medium">{cat.label}</span></label>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        className="btn btn-ghost btn-xs p-0"
                                                        onClick={() => setReviewForm(f => ({ ...f, [cat.key]: n }))}
                                                    >
                                                        <Star className={`w-6 h-6 ${n <= reviewForm[cat.key] ? "text-warning fill-warning" : "text-base-content/20"}`} />
                                                    </button>
                                                ))}
                                                <span className="text-sm ml-2 text-base-content/60">
                                                    {reviewForm[cat.key] > 0 ? RATING_LABELS[reviewForm[cat.key] - 1] : "Not rated"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="form-control">
                                    <label className="label"><span className="label-text">Your Feedback</span></label>
                                    <textarea className="textarea textarea-bordered h-24" placeholder="Tell us about your experience..." value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
                                </div>

                                <div className="flex items-center gap-3">
                                    <button type="submit" className="btn btn-primary" disabled={reviewSubmitting || reviewForm.ratingOverall === 0}>
                                        {reviewSubmitting ? <span className="loading loading-spinner loading-sm" /> : "Submit Review"}
                                    </button>
                                </div>
                                {reviewResult && (
                                    <div className={`alert ${reviewResult.startsWith("Review submitted") ? "alert-success" : "alert-error"}`}>{reviewResult}</div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
