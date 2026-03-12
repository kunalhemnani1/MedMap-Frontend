"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Star,
  MapPin,
  Phone,
  Clock,
  BadgeCheck,
  Heart,
  Share2,
  Navigation,
  Building2,
  ChevronRight,
  Loader2,
  Calendar,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";

interface HospitalPageProps {
  params: Promise<{ slug: string }>;
}

const TABS = ["Overview", "Procedures", "Reviews", "Location", "Contact"];

interface HospitalData {
  Sr_No: number;
  Hospital_Name: string;
  Address_Original_First_Line: string;
  State: string;
  District: string;
  Pincode: number;
  Telephone: string;
  Mobile_Number: number | string;
  Emergency_Num: number | string;
  Location: string;
  Location_Coordinates: string;
  doctors: {
    name: string;
    specialty: string;
    qualification: string;
    experience: number;
    fee: number;
    rating: number;
  }[];
  review_summary: {
    average_rating: number;
    total_reviews: number;
  };
  procedures: {
    Procedure_Name: string;
    Price_INR: number;
    Procedure_Category: string;
  }[];
  [key: string]: unknown;
}

export default function HospitalDetailPage({ params }: HospitalPageProps) {
  const { slug } = use(params);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isSaved, setIsSaved] = useState(false);
  const [data, setData] = useState<HospitalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<
    { User_Name: string; Rating: number; Review_Date: string; Review_Comment: string; Review_Title: string }[]
  >([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/hospitals/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json);

        // Fetch reviews for this hospital
        const rRes = await fetch(`/api/reviews?hospital_id=${slug}`);
        if (rRes.ok) {
          const rJson = await rRes.json();
          setReviews(rJson.reviews || []);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.Hospital_Name) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Building2 className="w-16 h-16 text-base-content/20" />
        <h2 className="text-xl font-semibold">Hospital Not Found</h2>
        <Link href="/search" className="btn btn-primary">Back to Search</Link>
      </div>
    );
  }

  const hospital = data;
  const doctors = data.doctors || [];
  const pricing = data.procedures || [];
  const reviewStats = data.review_summary || { average_rating: 0, total_reviews: 0 };

  const specialties = [...new Set(doctors.map((d) => d.specialty))];
  const phone = hospital.Telephone || (hospital.Mobile_Number ? String(hospital.Mobile_Number) : "");

  return (
    <div className="min-h-screen bg-base-100">
      <Breadcrumb
        items={[
          { label: "Search", href: "/search" },
          { label: hospital.Hospital_Name, href: `/hospital/${slug}` },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="relative h-64 md:h-96 bg-base-200 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Building2 className="w-24 h-24 text-base-content/20" />
              </div>
              {/* Add real images here */}
            </div>
          </div>

          {/* Info Card */}
          <div className="card bg-base-100 border border-base-200 shadow-lg">
            <div className="card-body">
              <h1 className="card-title text-2xl">{hospital.Hospital_Name}</h1>

              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="font-medium">{reviewStats.average_rating.toFixed(1)}</span>
                <span className="text-base-content/50">
                  ({reviewStats.total_reviews} reviews)
                </span>
              </div>

              <p className="text-sm text-base-content/70 flex items-start gap-2 mt-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                {hospital.Address_Original_First_Line}, {hospital.District}, {hospital.State} -{" "}
                {hospital.Pincode}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {specialties.length > 0 && (
                  <span className="badge badge-primary badge-outline gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    {specialties.length} Specialties
                  </span>
                )}
                {hospital.Emergency_Num && Number(hospital.Emergency_Num) !== 0 && (
                  <span className="badge badge-success gap-1">
                    <Clock className="w-3 h-3" />
                    Emergency
                  </span>
                )}
              </div>

              <div className="divider" />

              <div className="flex gap-2">
                <button
                  className={`btn btn-sm flex-1 ${isSaved ? "btn-primary" : "btn-outline"
                    }`}
                  onClick={() => setIsSaved(!isSaved)}
                >
                  <Heart
                    className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
                  />
                  {isSaved ? "Saved" : "Save"}
                </button>
                <button className="btn btn-sm btn-outline">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button className="btn btn-sm btn-outline">
                  <Navigation className="w-4 h-4" />
                  Directions
                </button>
              </div>

              <a
                href={`tel:${phone}`}
                className="btn btn-primary btn-block mt-4"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </a>

              <a
                href={`/book-appointment`}
                className="btn btn-success btn-block mt-2"
              >
                <Calendar className="w-4 h-4" />
                Book Appointment
              </a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`tab tab-lg ${activeTab === tab ? "tab-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-100">
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-base-content/70 leading-relaxed mb-6">
                  {hospital.Hospital_Name} is located in {hospital.District}, {hospital.State}.
                  {hospital.Location ? ` Address: ${hospital.Location}.` : ""}
                </p>

                {specialties.length > 0 && (
                  <>
                    <h3 className="font-semibold mb-3">Specialties ({specialties.length})</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {specialties.map((s) => (
                        <span key={s} className="badge badge-lg badge-ghost">
                          {s}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {doctors.length > 0 && (
                  <>
                    <h3 className="font-semibold mb-3">Doctors ({doctors.length})</h3>
                    <div className="space-y-2 mb-6">
                      {doctors.slice(0, 5).map((d, i) => (
                        <div key={i} className="flex items-center justify-between bg-base-200 rounded-lg p-3">
                          <div>
                            <div className="font-medium">{d.name}</div>
                            <div className="text-sm text-base-content/60">{d.specialty} &middot; {d.experience}y exp</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-primary">₹{d.fee}</div>
                            <div className="text-xs text-base-content/60">★ {d.rating}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

              </div>

              <div className="card bg-base-200 border border-base-300">
                <div className="card-body">
                  <h2 className="card-title">Quick Price Check</h2>
                  <div className="divide-y divide-base-300">
                    {pricing.slice(0, 5).map((proc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-3"
                      >
                        <span className="text-sm">{proc.Procedure_Name}</span>
                        <span className="font-semibold text-primary">
                          ₹{proc.Price_INR.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                    {pricing.length === 0 && (
                      <p className="py-3 text-base-content/60 text-sm">No pricing data available</p>
                    )}
                  </div>
                  <Link
                    href={`/hospital/${slug}/procedures`}
                    className="btn btn-outline btn-sm mt-4"
                  >
                    View All Procedures
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Procedures" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">All Procedures</h2>
                <input
                  type="text"
                  placeholder="Search procedures..."
                  className="input input-bordered input-sm w-64"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Procedure</th>
                      <th>Price</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.map((proc, i) => (
                      <tr key={i} className="hover">
                        <td className="font-medium">{proc.Procedure_Name}</td>
                        <td className="text-primary font-semibold">
                          ₹{proc.Price_INR.toLocaleString("en-IN")}
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm">
                            Book Now
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Reviews" && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold">{reviewStats.average_rating.toFixed(1)}</div>
                  <div className="flex text-warning">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < Math.floor(reviewStats.average_rating) ? "fill-current" : ""
                            }`}
                        />
                      ))}
                  </div>
                  <div className="text-sm text-base-content/50">
                    {reviewStats.total_reviews} reviews
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {reviews.map((review, i) => (
                  <div key={i} className="card bg-base-200 border border-base-300">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded-full w-10">
                              <span>{review.User_Name?.[0] || "?"}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{review.User_Name}</div>
                            <div className="text-xs text-base-content/50">
                              {review.Review_Date}
                            </div>
                          </div>
                        </div>
                        <div className="flex text-warning">
                          {Array(review.Rating)
                            .fill(0)
                            .map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 fill-current"
                              />
                            ))}
                        </div>
                      </div>
                      <p className="text-sm font-medium mt-2">{review.Review_Title}</p>
                      <p className="text-sm text-base-content/70">
                        {review.Review_Comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Location" && (
            <div>
              <div className="h-96 bg-base-200 rounded-2xl flex items-center justify-center mb-6">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-base-content/30 mx-auto mb-2" />
                  <p className="text-base-content/50">
                    Google Maps integration coming soon
                  </p>
                </div>
              </div>
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="font-semibold">Address</h3>
                  <p className="text-base-content/70">
                    {hospital.Address_Original_First_Line}, {hospital.District}, {hospital.State} -{" "}
                    {hospital.Pincode}
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${hospital.Hospital_Name} ${hospital.District} ${hospital.State}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm w-fit mt-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Contact" && (
            <div className="max-w-xl">
              <div className="card bg-base-200 border border-base-300 mb-6">
                <div className="card-body">
                  <h3 className="font-semibold mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center gap-3 hover:text-primary"
                    >
                      <Phone className="w-5 h-5" />
                      {phone || "N/A"}
                    </a>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5" />
                      {hospital.Address_Original_First_Line}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-200 border border-base-300">
                <div className="card-body">
                  <h3 className="font-semibold mb-4">Send Inquiry</h3>
                  <form className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Email</span>
                      </label>
                      <input
                        type="email"
                        className="input input-bordered"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Message</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered"
                        rows={4}
                        placeholder="Your inquiry..."
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
