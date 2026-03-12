"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search,
  BadgeCheck,
  TrendingDown,
  Building2,
  Star,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Stethoscope,
  Microscope,
  Syringe,
  Baby,
  HeartPulse,
  Smile,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { HealthcareBg } from "@/components/ui/healthcare-bg";
import StatCard from "@/components/cards/StatCard";

const CATEGORIES = [
  { name: "Diagnostic", icon: Microscope, color: "text-blue-500" },
  { name: "Surgical", icon: Syringe, color: "text-red-500" },
  { name: "Dental", icon: Smile, color: "text-green-500" },
  { name: "Maternity", icon: Baby, color: "text-pink-500" },
  { name: "Emergency", icon: HeartPulse, color: "text-orange-500" },
  { name: "Wellness", icon: Stethoscope, color: "text-teal-500" },
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <HealthcareBg />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 badge badge-lg badge-outline mb-6 p-4 bg-base-100/50 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            New: AI-Powered Price Predictions
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Healthcare Costs,
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-blue-600">
              Transparent & Fair.
            </span>
          </h1>

          <p className="text-xl text-base-content/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Compare actual costs for medical procedures across hospitals.
            Check insurance compatibility, wait times, and patient outcomes.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto transition-transform hover:scale-[1.01] duration-300"
          >
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary z-10" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Try 'MRI Scan in Mumbai' or 'Root Canal'"
                className="input input-lg w-full pl-16 pr-20 h-20 shadow-xl border-2 border-base-300 rounded-full focus:border-primary focus:ring-4 focus:ring-primary/20 text-lg"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-black" />
              </button>
            </div>
          </form>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 justify-center mt-10 text-sm">
            <span className="flex items-center gap-2 bg-base-100/80 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-success/50">
              <BadgeCheck className="w-6 h-6 text-success" />
              <span className="font-medium text-base-content">Verified Prices</span>
            </span>
            <span className="flex items-center gap-2 bg-base-100/80 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-primary/50">
              <Clock className="w-6 h-6 text-primary" />
              <span className="font-medium text-base-content">Instant Booking</span>
            </span>
            <span className="flex items-center gap-2 bg-base-100/80 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-blue-500">
              <Shield className="w-6 h-6 text-blue-500" />
              <span className="font-medium text-base-content">Insurance Check</span>
            </span>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4 md:px-8 bg-base-200/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Browse by Category</h2>
            <p className="text-base-content/60">
              Find procedures across major healthcare categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/categories/${cat.name.toLowerCase()}`}
                className="card bg-base-100 border border-base-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="card-body items-center text-center p-6">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-base-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${cat.color}`}
                  >
                    <cat.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/categories" className="btn btn-outline gap-2">
              View All Categories
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={<Building2 className="w-7 h-7 text-primary" />}
              value="500+"
              label="Hospitals Listed"
              trend="+12% this month"
              trendUp
            />
            <StatCard
              icon={<Stethoscope className="w-7 h-7 text-primary" />}
              value="10,000+"
              label="Procedures Compared"
              trend="+8% this month"
              trendUp
            />
            <StatCard
              icon={<TrendingDown className="w-7 h-7 text-primary" />}
              value="₹2Cr+"
              label="Saved by Users"
              trend="Avg 35% savings"
              trendUp
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-8 bg-base-200/50">
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why MedMap?</h2>
            <p className="text-xl text-base-content/60">
              We bring clarity into healthcare pricing
            </p>
          </div>

          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                <TrendingDown className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-3xl font-bold">Total Price Transparency</h3>
              <p className="text-lg text-base-content/70 leading-relaxed">
                Never get hit with a surprise bill again. We aggregate real
                billing data to show you the{" "}
                <strong>exact cost</strong> of procedures before you book.
                Compare cash prices vs insurance rates instantly.
              </p>
              <Link href="/search" className="btn btn-outline btn-primary">
                Start Comparing
              </Link>
            </div>
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-0 bg-teal-500/10 rounded-3xl rotate-3" />
                <div className="relative bg-base-100 p-8 rounded-3xl shadow-xl border border-base-200">
                  <div className="text-center">
                    <div className="text-5xl font-mono font-bold text-teal-600 mb-2">
                      ₹4,500
                    </div>
                    <div className="text-sm text-base-content/50 line-through">
                      avg ₹8,200
                    </div>
                    <div className="badge badge-success gap-2 mt-4 p-3">
                      <TrendingDown className="w-4 h-4" />
                      Save 45%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="flex-1 space-y-6 md:text-right">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center md:ml-auto">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold">Quality First</h3>
              <p className="text-lg text-base-content/70 leading-relaxed">
                Cheap doesn&apos;t mean bad. We rank providers based on{" "}
                <strong>clinical outcomes</strong>, infection rates, and verified
                patient reviews. Make the best choice for your health.
              </p>
              <Link href="/insights" className="btn btn-outline btn-secondary">
                View Methodology
              </Link>
            </div>
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-3xl -rotate-3" />
                <div className="relative bg-base-100 p-6 rounded-3xl shadow-xl border border-base-200 space-y-4">
                  <div className="flex items-center gap-4 border-b border-base-200 pb-4">
                    <div className="avatar">
                      <div className="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <img
                          src="/images/doctor.png"
                          alt="Dr. Sharma portrait"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">Dr. Sharma</div>
                      <div className="text-xs text-success">98% Success Rate</div>
                    </div>
                    <div className="flex text-warning">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="avatar">
                      <div className="w-12 rounded-full ring ring-secondary ring-offset-base-100 ring-offset-2">
                        <img
                          src="/images/clinic.png"
                          alt="City Clinic exterior"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">City Clinic</div>
                      <div className="text-xs text-success">Top 1% in Mumbai</div>
                    </div>
                    <div className="flex text-warning">
                      {Array(4)
                        .fill(0)
                        .map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      <Star className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold">Insurance Demystified</h3>
              <p className="text-lg text-base-content/70 leading-relaxed">
                Input your policy details and instantly see{" "}
                <strong>in-network</strong> providers. We calculate your
                estimated copay and deductible usage so you know what you&apos;ll owe.
              </p>
              <Link href="/insurance-checker" className="btn btn-outline btn-accent">
                Check Coverage
              </Link>
            </div>
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/10 rounded-3xl rotate-3" />
                <div className="relative bg-base-100 p-6 rounded-3xl shadow-xl border border-base-200 space-y-3">
                  <div className="flex justify-between items-center bg-base-200 p-3 rounded-lg">
                    <span>Bajaj Allianz</span>
                    <span className="badge badge-success">Covered</span>
                  </div>
                  <div className="flex justify-between items-center bg-base-200 p-3 rounded-lg opacity-50">
                    <span>Star Health</span>
                    <span className="badge badge-error">Out of Network</span>
                  </div>
                  <div className="flex justify-between items-center bg-base-200 p-3 rounded-lg">
                    <span>HDFC Ergo</span>
                    <span className="badge badge-success">Covered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to find the best healthcare value?
          </h2>
          <p className="text-xl text-base-content/60 mb-8">
            Join thousands of patients who saved money without compromising on
            quality care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="btn btn-primary btn-lg">
              Start Searching
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/categories" className="btn btn-outline btn-lg">
              Browse Categories
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
