"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Syringe,
  Baby,
  HeartPulse,
  Microscope,
  Smile,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";

const ICON_MAP: Record<string, React.ElementType> = {
  Radiology: Microscope,
  Pathology: Microscope,
  Cardiology: HeartPulse,
  Orthopedics: Syringe,
  Gynecology: Baby,
  "General Surgery": Syringe,
  Ophthalmology: Smile,
  ENT: Stethoscope,
  Urology: Stethoscope,
  Neurology: HeartPulse,
  Dental: Smile,
  Dermatology: Smile,
  Gastroenterology: Stethoscope,
  Oncology: HeartPulse,
  Pediatrics: Baby,
  Pulmonology: HeartPulse,
};

const COLOR_MAP: Record<string, string> = {
  Radiology: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600",
  Pathology: "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
  Cardiology: "bg-red-100 dark:bg-red-900/30 text-red-600",
  Orthopedics: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
  Gynecology: "bg-pink-100 dark:bg-pink-900/30 text-pink-600",
  "General Surgery": "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
  Ophthalmology: "bg-green-100 dark:bg-green-900/30 text-green-600",
  ENT: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
  Urology: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600",
  Neurology: "bg-violet-100 dark:bg-violet-900/30 text-violet-600",
  Dental: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
  Dermatology: "bg-rose-100 dark:bg-rose-900/30 text-rose-600",
};

interface Category {
  name: string;
  count: number;
  avg_price: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/pricing/categories");
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setCategories(json.categories || []);
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-base-100">
      <Breadcrumb items={[{ label: "Categories", href: "/categories" }]} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Browse by Category</h1>
          <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
            Find the right procedure and compare prices across hospitals in your area.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        ) : (
          <>
            {/* Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {categories.map((category) => {
                const Icon = ICON_MAP[category.name] || Stethoscope;
                const color = COLOR_MAP[category.name] || "bg-teal-100 dark:bg-teal-900/30 text-teal-600";
                return (
                  <Link
                    key={category.name}
                    href={`/search?q=${encodeURIComponent(category.name)}`}
                    className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
                  >
                    <div className="card-body">
                      <div
                        className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      <h2 className="card-title text-xl group-hover:text-primary transition-colors">
                        {category.name}
                      </h2>
                      <p className="text-sm text-base-content/60 mb-2">
                        Avg price: ₹{Math.round(category.avg_price).toLocaleString("en-IN")}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-base-200">
                        <span className="text-sm text-base-content/50">
                          {category.count} procedures
                        </span>
                        <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
