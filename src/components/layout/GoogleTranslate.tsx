"use client";

import { useEffect } from "react";

declare global {
    interface Window {
        googleTranslateElementInit?: () => void;
        google?: {
            translate: {
                TranslateElement: new (
                    options: { pageLanguage: string; includedLanguages: string; layout: number; autoDisplay: boolean },
                    id: string
                ) => void;
            };
        };
    }
}

export default function GoogleTranslate() {
    useEffect(() => {
        window.googleTranslateElementInit = () => {
            if (window.google?.translate?.TranslateElement) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: "en",
                        includedLanguages:
                            "en,hi,bn,te,mr,ta,gu,kn,ml,pa,ur,or,as,en",
                        layout: 0,
                        autoDisplay: false,
                    },
                    "google_translate_element"
                );
            }
        };

        const script = document.createElement("script");
        script.src =
            "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
            delete window.googleTranslateElementInit;
        };
    }, []);

    return (
        <div
            id="google_translate_element"
            className="hidden"
            aria-hidden="true"
        />
    );
}
