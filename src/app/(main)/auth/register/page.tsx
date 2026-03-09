"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { UserPlus, Mail, Lock, User, AlertCircle, Building2, Stethoscope, Users } from "lucide-react";

const ROLES = [
    { id: "user", label: "Patient", icon: Users, description: "Search and compare hospital prices" },
    { id: "doctor", label: "Doctor", icon: Stethoscope, description: "Manage your practice profile" },
    { id: "admin", label: "Hospital Admin", icon: Building2, description: "Manage hospital listings" },
] as const;

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<string>("user");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const result = await signUp.email({
                email,
                password,
                name,
                role,
            });
            if (result.error) {
                setError(result.error.message || "Registration failed");
            } else {
                router.push("/user/dashboard");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-12">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                            <UserPlus className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold">Create Account</h1>
                        <p className="text-base-content/60 text-sm mt-1">Join MedMap to start saving on healthcare</p>
                    </div>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Role Selection */}
                        <div className="form-control">
                            <label className="label"><span className="label-text font-medium">I am a</span></label>
                            <div className="grid grid-cols-3 gap-2">
                                {ROLES.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setRole(r.id)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${role === r.id
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-base-200 hover:border-primary/40"
                                            }`}
                                    >
                                        <r.icon className="w-5 h-5" />
                                        <span className="text-xs font-medium">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label"><span className="label-text font-medium">Full Name</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                                <input
                                    type="text"
                                    placeholder="Dr. Jane Smith"
                                    className="input input-bordered w-full pl-10"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label"><span className="label-text font-medium">Email</span></label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    className="input input-bordered w-full pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label"><span className="label-text font-medium">Password</span></label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                                <input
                                    type="password"
                                    placeholder="Min 8 characters"
                                    className="input input-bordered w-full pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="divider text-sm text-base-content/40">or</div>

                    <p className="text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="link link-primary font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
