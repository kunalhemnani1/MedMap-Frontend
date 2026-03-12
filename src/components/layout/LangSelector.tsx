"use client";

import { useState, useRef, useEffect } from "react";
import { Languages } from "lucide-react";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "bn", label: "বাংলা" },
    { code: "te", label: "తెలుగు" },
    { code: "mr", label: "मराठी" },
    { code: "ta", label: "தமிழ்" },
    { code: "gu", label: "ગુજરાતી" },
    { code: "kn", label: "ಕನ್ನಡ" },
    { code: "ml", label: "മലയാളം" },
    { code: "pa", label: "ਪੰਜਾਬੀ" },
    { code: "ur", label: "اردو" },
];

function triggerGoogleTranslate(langCode: string) {
    // Find the hidden Google Translate combo box and fire a change event on it
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event("change"));
        return;
    }
    // Fallback: set the googtrans cookie and reload
    document.cookie = `googtrans=/en/${langCode}; path=/`;
    window.location.reload();
}

export default function LangSelector() {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState("en");
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    function select(code: string) {
        setCurrent(code);
        setOpen(false);
        triggerGoogleTranslate(code);
    }

    const currentLabel = LANGUAGES.find((l) => l.code === current)?.label ?? "EN";

    return (
        <div className="relative" ref={ref}>
            <button
                className="btn btn-ghost btn-sm gap-1 notranslate"
                onClick={() => setOpen((v) => !v)}
                aria-label="Select language"
            >
                <Languages className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium uppercase">
                    {currentLabel}
                </span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-base-100 border border-base-200 rounded-box shadow-xl w-44 overflow-hidden">
                    <ul className="menu p-1 max-h-80 overflow-y-auto">
                        {LANGUAGES.map((lang) => (
                            <li key={lang.code}>
                                <button
                                    className={`text-sm notranslate ${current === lang.code ? "active font-semibold" : ""}`}
                                    onClick={() => select(lang.code)}
                                >
                                    {lang.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
