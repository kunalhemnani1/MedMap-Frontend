"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
    Mic,
    MicOff,
    Square,
    FileText,
    ChevronDown,
    ChevronUp,
    Download,
    RotateCcw,
    ShieldCheck,
    AlertCircle,
    Clock,
    Stethoscope,
    Building2,
    Clipboard,
    User,
    Captions,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { useSession } from "@/lib/auth-client";

/* ─────────────────────────────────────────────────────── types */
type Phase = "consent" | "recording" | "processing" | "summary";

interface VisitDetails {
    doctorName: string;
    doctorSpecialty: string;
    hospitalName: string;
    department: string;
    appointmentId: string;
    patientName: string;
    notes: string;
}

const EMPTY_DETAILS: VisitDetails = {
    doctorName: "",
    doctorSpecialty: "",
    hospitalName: "",
    department: "",
    appointmentId: "",
    patientName: "",
    notes: "",
};

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

/* ─────────────────────────────────────────────────────── page */
export default function RecordVisitPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const userRole = (session?.user as { role?: string } | undefined)?.role;

    /* ── phase & form ─────────────────────────────────────── */
    const [phase, setPhase] = useState<Phase>("consent");
    const [details, setDetails] = useState<VisitDetails>(EMPTY_DETAILS);
    const [consentChecked, setConsentChecked] = useState(false);

    /* ── recording state ──────────────────────────────────── */
    const [isRecording, setIsRecording] = useState(false);
    const isRecordingRef = useRef(false);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* ── transcript ───────────────────────────────────────── */
    const [finalTranscript, setFinalTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const liveBoxRef = useRef<HTMLDivElement>(null);

    /* ── summary / processing ─────────────────────────────── */
    const [summary, setSummary] = useState("");
    const [processingStep, setProcessingStep] = useState("Analysing transcript…");
    const [transcriptExpanded, setTranscriptExpanded] = useState(false);

    /* ── errors ───────────────────────────────────────────── */
    const [micError, setMicError] = useState("");
    const [apiError, setApiError] = useState("");

    /* ── AssemblyAI session id ────────────────────────────── */
    const visitIdRef = useRef<string | null>(null);

    /* ── auth guard ───────────────────────────────────────── */
    useEffect(() => {
        if (!isPending && session?.user && userRole !== "user") router.replace("/");
    }, [isPending, session, userRole, router]);

    /* ── auto-scroll live captions ────────────────────────── */
    useEffect(() => {
        if (liveBoxRef.current) {
            liveBoxRef.current.scrollTop = liveBoxRef.current.scrollHeight;
        }
    }, [finalTranscript, interimTranscript]);

    /* ── cleanup on unmount ───────────────────────────────── */
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (pollRef.current) clearInterval(pollRef.current);
            if (visitIdRef.current) {
                fetch("/api/record-visit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "stop", visitId: visitIdRef.current }),
                }).catch(() => { });
            }
        };
    }, []);

    /* ─────────────────────────────────────────────────────── handlers */

    /**
     * Starts an AssemblyAI streaming session via POST /api/record-visit { action: "start" }.
     * Then polls GET /api/record-visit/transcript?visitId=... every 800 ms to get live turns.
     */
    const startRecording = async () => {
        setMicError("");
        setApiError("");
        setFinalTranscript("");
        setInterimTranscript("");
        visitIdRef.current = null;

        try {
            const res = await fetch("/api/record-visit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "start" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to start recording");

            visitIdRef.current = data.visitId;

            // Poll the live-transcript endpoint for real-time turns from AssemblyAI
            pollRef.current = setInterval(async () => {
                if (!isRecordingRef.current || !visitIdRef.current) return;
                try {
                    const pollRes = await fetch(
                        `/api/record-visit/transcript?visitId=${visitIdRef.current}`
                    );
                    if (!pollRes.ok) return;
                    const pollData = await pollRes.json();
                    if (pollData.final !== undefined) setFinalTranscript(pollData.final);
                    if (pollData.interim !== undefined) setInterimTranscript(pollData.interim);
                } catch {
                    // silently ignore transient poll errors
                }
            }, 800);

            setPhase("recording");
            setIsRecording(true);
            isRecordingRef.current = true;
            setElapsed(0);
            timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
        } catch (err: unknown) {
            setMicError(err instanceof Error ? err.message : "Could not start recording");
        }
    };

    /**
     * Stops recording: clears timers, calls POST /api/record-visit { action: "stop" }.
     * The route returns the full joined transcript from AssemblyAI.
     */
    const stopRecording = async () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        setIsRecording(false);
        isRecordingRef.current = false;
        setInterimTranscript("");

        if (!visitIdRef.current) return;
        try {
            const res = await fetch("/api/record-visit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "stop", visitId: visitIdRef.current }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to stop recording");
            // Use the definitive transcript returned by the server
            if (data.transcript) setFinalTranscript(data.transcript);
        } catch (err: unknown) {
            setApiError(err instanceof Error ? err.message : "Error stopping recording");
        }
    };

    /**
     * Resumes by opening a fresh AssemblyAI session and appending new turns
     * to the existing finalTranscript.
     */
    const resumeRecording = async () => {
        setApiError("");
        try {
            const res = await fetch("/api/record-visit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "start" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to resume");
            visitIdRef.current = data.visitId;

            pollRef.current = setInterval(async () => {
                if (!isRecordingRef.current || !visitIdRef.current) return;
                try {
                    const pollRes = await fetch(
                        `/api/record-visit/transcript?visitId=${visitIdRef.current}`
                    );
                    if (!pollRes.ok) return;
                    const pollData = await pollRes.json();
                    // Append new turns after the existing transcript
                    if (pollData.final) {
                        setFinalTranscript((prev) =>
                            prev ? `${prev} ${pollData.final}` : pollData.final
                        );
                    }
                    if (pollData.interim !== undefined) setInterimTranscript(pollData.interim);
                } catch {
                    // silently ignore
                }
            }, 800);

            setIsRecording(true);
            isRecordingRef.current = true;
            timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
        } catch (err: unknown) {
            setApiError(err instanceof Error ? err.message : "Failed to resume");
        }
    };

    /**
     * Sends the final transcript + visit details to POST /api/record-visit/analyse
     * which calls Gemini 2.5 Flash and returns a markdown summary.
     */
    const submitForSummary = async () => {
        if (!finalTranscript.trim()) return;
        setPhase("processing");
        setProcessingStep("Sending transcript to Gemini 2.5 Flash…");

        try {
            const res = await fetch("/api/record-visit/analyse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript: finalTranscript, details }),
            });
            setProcessingStep("Formatting visit summary…");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Analysis failed");
            setSummary(data.summary);
            setPhase("summary");
        } catch (err: unknown) {
            setApiError(err instanceof Error ? err.message : "Failed to generate summary");
            setPhase("recording");
        }
    };

    const downloadSummary = () => {
        const blob = new Blob([summary], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `visit-summary-${details.doctorName.replace(/\s+/g, "-") || "visit"}-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        // Best-effort stop any active session
        if (visitIdRef.current) {
            fetch("/api/record-visit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "stop", visitId: visitIdRef.current }),
            }).catch(() => { });
        }
        visitIdRef.current = null;
        setPhase("consent");
        setDetails(EMPTY_DETAILS);
        setConsentChecked(false);
        setIsRecording(false);
        isRecordingRef.current = false;
        setElapsed(0);
        setFinalTranscript("");
        setInterimTranscript("");
        setSummary("");
        setMicError("");
        setApiError("");
        setTranscriptExpanded(false);
    };

    /* ─────────────────────────────────────────────────────── render */

    if (isPending) return (
        <div className="min-h-screen flex items-center justify-center">
            <span className="loading loading-spinner loading-lg" />
        </div>
    );

    return (
        <div className="min-h-screen bg-base-200">
            <Breadcrumb />
            <div className="container mx-auto px-4 py-10 max-w-2xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4">
                        <Mic className="w-8 h-8 text-error" />
                    </div>
                    <h1 className="text-3xl font-bold">Companion Scribe</h1>
                    <p className="text-base-content/60 mt-2 max-w-md mx-auto">
                        Record your doctor&apos;s visit to get a complete, understandable summary afterwards.
                    </p>
                    <div className="badge badge-ghost badge-sm mt-2 gap-1">
                        <Captions className="w-3 h-3" /> Powered by AssemblyAI + Gemini — 100% free
                    </div>
                </div>

                {/* ══ CONSENT ══ */}
                {phase === "consent" && (
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body gap-6">

                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                    <User className="w-5 h-5 text-primary" /> Patient Details
                                </h2>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Your Name</span></label>
                                    <input type="text" className="input input-bordered" placeholder="Your full name" value={details.patientName} onChange={e => setDetails(d => ({ ...d, patientName: e.target.value }))} />
                                </div>
                            </div>

                            <div className="divider my-0" />

                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                    <Stethoscope className="w-5 h-5 text-primary" /> Healthcare Provider
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Doctor Name *</span></label>
                                        <input type="text" className="input input-bordered" placeholder="Dr. Ravi Kumar" value={details.doctorName} onChange={e => setDetails(d => ({ ...d, doctorName: e.target.value }))} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Specialty</span></label>
                                        <input type="text" className="input input-bordered" placeholder="e.g. Cardiology" value={details.doctorSpecialty} onChange={e => setDetails(d => ({ ...d, doctorSpecialty: e.target.value }))} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Hospital / Clinic</span></label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                                            <input type="text" className="input input-bordered pl-9" placeholder="Apollo Hospitals, Delhi" value={details.hospitalName} onChange={e => setDetails(d => ({ ...d, hospitalName: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Department</span></label>
                                        <input type="text" className="input input-bordered" placeholder="e.g. OPD, Cardiology" value={details.department} onChange={e => setDetails(d => ({ ...d, department: e.target.value }))} />
                                    </div>
                                </div>
                            </div>

                            <div className="divider my-0" />

                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                    <Clipboard className="w-5 h-5 text-primary" /> Visit Details
                                </h2>
                                <div className="grid gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Appointment ID</span>
                                            <span className="label-text-alt opacity-60">Optional</span>
                                        </label>
                                        <input type="text" className="input input-bordered" placeholder="From your MedMap booking" value={details.appointmentId} onChange={e => setDetails(d => ({ ...d, appointmentId: e.target.value }))} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Reason / Notes</span>
                                            <span className="label-text-alt opacity-60">Optional — helps improve the summary</span>
                                        </label>
                                        <textarea className="textarea textarea-bordered h-20" placeholder="e.g. Follow-up for chest pain, diabetes management…" value={details.notes} onChange={e => setDetails(d => ({ ...d, notes: e.target.value }))} />
                                    </div>
                                </div>
                            </div>

                            <div className="divider my-0" />

                            <div className="bg-base-200 rounded-xl p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
                                    <p className="text-sm text-base-content/80">
                                        By pressing the button below, you confirm that <strong>both the healthcare provider and the patient</strong> have agreed to record this visit.
                                        Audio is streamed to AssemblyAI for transcription and is never stored permanently.
                                    </p>
                                </div>
                                <a href="/privacy-policy" className="link link-primary text-sm ml-8">Privacy Policy →</a>
                                <label className="flex items-center gap-3 cursor-pointer ml-8 mt-2">
                                    <input type="checkbox" className="checkbox checkbox-primary" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)} />
                                    <span className="text-sm font-medium">I confirm both parties have given consent to record this visit</span>
                                </label>
                            </div>

                            {micError && (
                                <div className="alert alert-error">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span className="text-sm">{micError}</span>
                                </div>
                            )}

                            <button className="btn btn-error btn-lg w-full gap-3" disabled={!consentChecked || !details.doctorName} onClick={startRecording}>
                                <span className="relative flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-white" />
                                </span>
                                Both Parties Consent — Start Recording
                            </button>
                            {!details.doctorName && (
                                <p className="text-xs text-center text-base-content/50 -mt-3">Doctor name is required to continue</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ══ RECORDING ══ */}
                {phase === "recording" && (
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body gap-5">
                            {/* Visit banner */}
                            <div className="bg-base-200 rounded-xl p-3 text-sm space-y-0.5">
                                <p><span className="font-medium">Doctor:</span> Dr. {details.doctorName}{details.doctorSpecialty ? ` — ${details.doctorSpecialty}` : ""}</p>
                                {details.hospitalName && <p><span className="font-medium">Hospital:</span> {details.hospitalName}</p>}
                            </div>

                            {/* Mic indicator */}
                            <div className="flex flex-col items-center gap-3">
                                <div className={`flex items-center justify-center w-20 h-20 rounded-full ${isRecording ? "bg-error animate-pulse" : "bg-base-300"}`}>
                                    {isRecording ? <Mic className="w-9 h-9 text-white" /> : <MicOff className="w-9 h-9 text-base-content/40" />}
                                </div>
                                <div className="flex items-center gap-2 font-mono text-2xl font-bold">
                                    <Clock className="w-5 h-5 text-base-content/40" />
                                    {formatTime(elapsed)}
                                </div>
                                {isRecording && (
                                    <p className="text-sm text-base-content/60 text-center">
                                        Listening — speak clearly near your device
                                    </p>
                                )}
                            </div>

                            {/* Live transcript */}
                            <div>
                                <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                                    <Captions className="w-3.5 h-3.5" /> Live Captions
                                </div>
                                <div ref={liveBoxRef} className="bg-base-200 rounded-xl p-3 h-36 overflow-y-auto text-sm leading-relaxed">
                                    {finalTranscript && <span>{finalTranscript}</span>}
                                    {interimTranscript && <span className="text-base-content/40 italic"> {interimTranscript}</span>}
                                    {!finalTranscript && !interimTranscript && (
                                        <span className="text-base-content/30 italic">Start speaking — captions will appear here…</span>
                                    )}
                                </div>
                            </div>

                            {apiError && (
                                <div className="alert alert-error">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span className="text-sm">{apiError}</span>
                                </div>
                            )}

                            <div className="flex gap-3 justify-center flex-wrap">
                                {isRecording ? (
                                    <button className="btn btn-error btn-lg gap-2" onClick={stopRecording}>
                                        <Square className="w-5 h-5 fill-current" /> Stop Recording
                                    </button>
                                ) : (
                                    <>
                                        <button className="btn btn-primary btn-lg gap-2" onClick={submitForSummary} disabled={!finalTranscript.trim()}>
                                            <FileText className="w-5 h-5" /> Generate Summary
                                        </button>
                                        <button className="btn btn-outline gap-2" onClick={resumeRecording}>
                                            <Mic className="w-4 h-4" /> Resume
                                        </button>
                                    </>
                                )}
                                <button className="btn btn-ghost btn-sm" onClick={reset}>
                                    <RotateCcw className="w-4 h-4" /> Start Over
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ PROCESSING ══ */}
                {phase === "processing" && (
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body items-center text-center gap-6 py-16">
                            <span className="loading loading-spinner loading-lg text-error" />
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Generating summary…</h2>
                                <p className="text-base-content/60">{processingStep}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ SUMMARY ══ */}
                {phase === "summary" && (
                    <div className="space-y-4">
                        <div className="card bg-success/10 border border-success/30">
                            <div className="card-body p-4">
                                <div className="flex items-center gap-2 text-success font-semibold">
                                    <ShieldCheck className="w-5 h-5" /> Visit Summary Ready
                                </div>
                                <p className="text-sm text-base-content/70 mt-1">
                                    {details.doctorName && `Dr. ${details.doctorName}`}
                                    {details.hospitalName && ` — ${details.hospitalName}`}
                                    <span className="ml-2 opacity-60">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                                </p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="card-title"><FileText className="w-5 h-5" /> Your Visit Summary</h2>
                                    <button className="btn btn-outline btn-sm gap-2" onClick={downloadSummary}>
                                        <Download className="w-4 h-4" /> Download
                                    </button>
                                </div>
                                <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown>{summary}</ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {/* Full transcript (collapsible) */}
                        <div className="card bg-base-100 shadow">
                            <div className="card-body p-4">
                                <button className="flex items-center justify-between w-full" onClick={() => setTranscriptExpanded(x => !x)}>
                                    <span className="font-medium text-sm flex items-center gap-2">
                                        <Mic className="w-4 h-4 text-base-content/50" /> Full Transcript
                                    </span>
                                    {transcriptExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {transcriptExpanded && (
                                    <div className="mt-3 bg-base-200 rounded-lg p-4 text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
                                        {finalTranscript || "No transcript available."}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="alert">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="text-xs">This AI summary is for informational purposes only. Always follow your doctor&apos;s written instructions. In case of emergency, call 112.</span>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button className="btn btn-outline gap-2" onClick={reset}>
                                <RotateCcw className="w-4 h-4" /> Record Another Visit
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
