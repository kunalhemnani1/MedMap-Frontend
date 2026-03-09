"use client";
import { useState, useEffect, Suspense, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Sparkles, GitCompare, X, MapIcon, LocateFixed } from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import FilterSidebar from "@/components/search/FilterSidebar";
import SortDropdown, { SortOption } from "@/components/search/SortDropdown";
import ViewToggle, { ViewMode } from "@/components/search/ViewToggle";
import ReactMarkdown from "react-markdown";
import HospitalCard from "@/components/cards/HospitalCard";
import SkeletonCard from "@/components/shared/SkeletonCard";
import EmptyState from "@/components/shared/EmptyState";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/search/MapView"), { ssr: false });

interface Hospital {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: number;
  latitude: number;
  longitude: number;
  telephone: string;
  mobile: string;
  emergency: string;
  email: string;
  website: string;
  specialties: string[];
  beds: number;
  rating: number;
  review_count: number;
  accreditations: string[];
  established_year: number;
  has_emergency: boolean;
  has_ambulance: boolean;
  has_pharmacy: boolean;
  has_blood_bank: boolean;
  has_icu: boolean;
  accepts_insurance: boolean;
  consultation_fee_range: number[];
  avg_wait_time_days: number;
  image_url: string;
  _score?: number;
  _distance_km?: number;
}

interface FacetItem {
  value: string;
  count: number;
}

interface SearchResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  results: Hospital[];
  facets?: {
    states: FacetItem[];
    districts: FacetItem[];
    pincodes: FacetItem[];
  };
}

const CATEGORY_POOL = ["Diagnostic", "Surgical", "Dental", "Maternity", "Emergency", "Wellness"] as const;
const PRICE_CEIL_DEFAULT = 10000;

const defaultFilters = {
  distance: "any",
  priceMin: 0,
  priceMax: PRICE_CEIL_DEFAULT,
  categories: [] as string[],
  rating: 0,
  insurance: false,
  availability: false,
  accreditation: [] as string[],
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState(defaultFilters);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [view, setView] = useState<ViewMode>("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // AI Insight State
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [results, setResults] = useState<Hospital[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facets, setFacets] = useState<SearchResponse["facets"]>(undefined);

  // Compare state
  const [compareIds, setCompareIds] = useState<Set<string | number>>(new Set());
  const toggleCompare = (id: string | number) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  };

  // Bookmark state
  const [savedIds, setSavedIds] = useState<Set<string | number>>(new Set());
  const toggleSave = (id: string | number) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGeoError("Location access denied. Distance features need your location."),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, []);

  // Throttle ref for price filter
  const priceThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingFilters, setPendingFilters] = useState(defaultFilters);

  const handleFilterChange = (next: typeof defaultFilters) => {
    const priceChanged = next.priceMin !== filters.priceMin || next.priceMax !== filters.priceMax;
    if (priceChanged) {
      setPendingFilters(next);
      if (priceThrottleRef.current) clearTimeout(priceThrottleRef.current);
      priceThrottleRef.current = setTimeout(() => {
        setFilters({ ...next, priceMax: Math.min(next.priceMax, priceCeil) });
      }, 400);
    } else {
      setFilters({ ...next, priceMax: Math.min(next.priceMax, priceCeil) });
      setPendingFilters(next);
    }
  };

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const q = searchParams.get("q");
      const pageParam = searchParams.get("page") || "1";
      const state = searchParams.get("state");
      const district = searchParams.get("district");
      const pincode = searchParams.get("pincode");

      if (q) params.append("query", q);
      params.append("page", pageParam);
      params.append("limit", "12");
      if (state) params.append("state", state);
      if (district) params.append("district", district);
      if (pincode) params.append("pincode", pincode);

      // Pass sort
      if (sort !== "relevance") params.append("sort", sort);

      // Pass user location for distance calculations
      if (userLocation) {
        params.append("lat", String(userLocation.lat));
        params.append("lon", String(userLocation.lng));
      }

      // Pass filters
      if (filters.distance !== "any") params.append("distance", filters.distance);
      if (filters.priceMin > 0) params.append("priceMin", String(filters.priceMin));
      if (filters.priceMax < PRICE_CEIL_DEFAULT) params.append("priceMax", String(filters.priceMax));
      if (filters.categories.length > 0) params.append("categories", filters.categories.join(","));
      if (filters.rating > 0) params.append("rating", String(filters.rating));
      if (filters.insurance) params.append("insurance", "true");
      if (filters.availability) params.append("availability", "true");
      if (filters.accreditation.length > 0) params.append("accreditation", filters.accreditation.join(","));

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data: SearchResponse = await res.json();
      setResults(data.results || []);
      setPage(data.page);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total);
      if (data.facets) setFacets(data.facets);
    } catch (err) {
      console.error(err);
      setError("Could not load results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, sort, filters, userLocation]);

  // Main fetch effect for Search Results + AI Insight
  useEffect(() => {
    // 1. Fetch Hospitals
    fetchResults();

    // 2. Fetch AI Insight
    const fetchAiInsight = async () => {
      const q = searchParams.get("q");
      const district = searchParams.get("district");
      const state = searchParams.get("state");
      const pincode = searchParams.get("pincode");

      if (!q && !district && !state && !pincode) {
        setAiInsight(null);
        return;
      }

      setIsAiLoading(true);
      try {
        const response = await fetch("/api/chat/hospital", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Summarize these search results for me.",
            searchParams: {
              query: q,
              district,
              state,
              pincode,
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAiInsight(data.text);
        }
      } catch (error) {
        console.error("Failed to fetch AI insight", error);
      } finally {
        setIsAiLoading(false);
      }
    };

    // Debounce AI fetch to save tokens
    const timeoutId = setTimeout(fetchAiInsight, 500);
    return () => clearTimeout(timeoutId);

  }, [searchParams, fetchResults]);

  // Handle page changes manually
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      // Update URL to trigger the main effect
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/search?${params.toString()}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).querySelector("input")?.value || "";
    setQuery(input);
    router.push(`/search?q=${encodeURIComponent(input)}`);
  };

  const deriveMeta = (hospital: Hospital) => {
    const priceFrom = hospital.consultation_fee_range?.[0] ?? 500;
    const seed = hospital.pincode || 0;
    const rand = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    const categories = CATEGORY_POOL.filter((_, idx) => rand(seed + idx + 6) > 0.6);

    // Use real distance from ES if available, otherwise estimate with Haversine
    let distance: number | null = null;
    if (hospital._distance_km != null) {
      distance = hospital._distance_km;
    } else if (userLocation && hospital.latitude && hospital.longitude) {
      const R = 6371;
      const dLat = ((hospital.latitude - userLocation.lat) * Math.PI) / 180;
      const dLon = ((hospital.longitude - userLocation.lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLocation.lat * Math.PI) / 180) * Math.cos((hospital.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      distance = Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
    }

    return {
      rating: hospital.rating ?? 4.0,
      reviewCount: hospital.review_count ?? 0,
      priceFrom,
      distance,
      hasInsurance: hospital.accepts_insurance ?? false,
      isOpenNow: hospital.has_emergency ?? false,
      categories: categories.length ? categories : [CATEGORY_POOL[seed % CATEGORY_POOL.length]],
      accreditation: hospital.accreditations ?? [],
    };
  };

  const priceCeil = useMemo(() => {
    if (!results.length) return PRICE_CEIL_DEFAULT;
    const maxPrice = Math.max(
      ...results.map((h) => deriveMeta(h).priceFrom),
      PRICE_CEIL_DEFAULT
    );
    return Math.ceil(maxPrice / 500) * 500; // round to nearest 500 for tidy slider
  }, [results]);

  const processedResults = useMemo(() => {
    const enriched = results.map((hospital) => ({ hospital, meta: deriveMeta(hospital) }));

    const filtered = enriched.filter(({ meta }) => {
      if (meta.priceFrom < (filters.priceMin || 0)) return false;
      if (meta.priceFrom > (filters.priceMax || PRICE_CEIL_DEFAULT)) return false;
      if (filters.rating && meta.rating < filters.rating) return false;
      if (filters.distance !== "any" && (meta.distance == null || meta.distance > Number(filters.distance))) return false;
      if (filters.insurance && !meta.hasInsurance) return false;
      if (filters.availability && !meta.isOpenNow) return false;
      if (filters.categories.length && !filters.categories.some((c) => meta.categories.includes(c as any))) return false;
      if (filters.accreditation.length && !filters.accreditation.some((a) => meta.accreditation.includes(a))) return false;
      return true;
    });

    switch (sort) {
      case "price-asc":
        return filtered.sort((a, b) => a.meta.priceFrom - b.meta.priceFrom);
      case "price-desc":
        return filtered.sort((a, b) => b.meta.priceFrom - a.meta.priceFrom);
      case "distance":
        return filtered.sort((a, b) => (a.meta.distance ?? 99999) - (b.meta.distance ?? 99999));
      case "rating":
        return filtered.sort((a, b) => b.meta.rating - a.meta.rating);
      case "reviews":
        return filtered.sort((a, b) => b.meta.reviewCount - a.meta.reviewCount);
      default:
        return filtered;
    }
  }, [results, filters, sort]);

  return (
    <div className="min-h-screen bg-base-100">
      <Breadcrumb
        items={[
          { label: "Search", href: "/search" },
          ...(query ? [{ label: `"${query}"`, href: `/search?q=${query}` }] : []),
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Search Header */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="join w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
              <input
                type="text"
                defaultValue={query}
                placeholder="Search procedures, hospitals..."
                className="input input-bordered join-item w-full pl-12"
              />
            </div>
            <button type="submit" className="btn btn-primary join-item">
              Search
            </button>
          </div>
        </form>

        <div className="flex gap-6">
          {/* Desktop Filters */}
          <FilterSidebar
            filters={pendingFilters}
            onFilterChange={handleFilterChange}
            onClear={() => { setFilters({ ...defaultFilters, priceMax: priceCeil }); setPendingFilters({ ...defaultFilters, priceMax: priceCeil }); }}
            priceCeil={priceCeil}
          />

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            {/* AI Insight Box */}
            {(aiInsight || isAiLoading) && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-teal-500/10 to-blue-600/10 border border-teal-200 dark:border-teal-800">
                <h3 className="flex items-center gap-2 text-sm font-bold text-teal-700 dark:text-teal-300 mb-2 uppercase tracking-wider">
                  <Sparkles size={16} />
                  AI Insight
                </h3>
                {isAiLoading ? (
                  <div className="h-4 w-3/4 bg-base-300 animate-pulse rounded"></div>
                ) : (
                  <div className="text-sm text-base-content/80 leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-teal-800 dark:text-teal-400" {...props} />,
                      }}
                    >
                      {aiInsight}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-semibold">
                  {processedResults.length > 0
                    ? `${processedResults.length} results${query ? ` for "${query}"` : ""}`
                    : query
                      ? `Searching for "${query}"...`
                      : "Search Results"}
                </h1>
                <p className="text-sm text-base-content/60">
                  Showing {processedResults.length} of {total || processedResults.length}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <button
                  className="btn btn-outline btn-sm lg:hidden gap-2"
                  onClick={() => setShowMobileFilters(true)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>

                <SortDropdown value={sort} onChange={setSort} />
                <ViewToggle value={view} onChange={setView} />
                <button
                  className={`btn btn-sm ${showMap ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setShowMap(!showMap)}
                  title="Toggle Map"
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Location banner */}
            {geoError && (
              <div className="alert alert-warning mb-4 text-sm">
                <LocateFixed className="w-4 h-4" />
                <span>{geoError}</span>
                <button className="btn btn-ghost btn-xs" onClick={() => {
                  setGeoError(null);
                  navigator.geolocation.getCurrentPosition(
                    (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => setGeoError("Location access denied.")
                  );
                }}>Retry</button>
              </div>
            )}

            {/* Map View */}
            {showMap && (
              <div className="mb-6">
                <MapView
                  hospitals={processedResults.map(({ hospital }) => ({
                    id: hospital.id,
                    name: hospital.name,
                    latitude: hospital.latitude,
                    longitude: hospital.longitude,
                    district: hospital.district,
                    state: hospital.state,
                    rating: hospital.rating,
                  }))}
                  userLocation={userLocation}
                />
              </div>
            )}

            {/* Mobile Filters */}
            {showMobileFilters && (
              <FilterSidebar
                filters={pendingFilters}
                onFilterChange={handleFilterChange}
                onClear={() => { setFilters({ ...defaultFilters, priceMax: priceCeil }); setPendingFilters({ ...defaultFilters, priceMax: priceCeil }); }}
                priceCeil={priceCeil}
                isMobile
                onClose={() => setShowMobileFilters(false)}
              />
            )}

            {/* Results Grid */}
            {isLoading ? (
              <div
                className={`grid gap-4 ${view === "list"
                  ? "grid-cols-1"
                  : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                  }`}
              >
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <SkeletonCard key={i} variant="hospital" />
                  ))}
              </div>
            ) : error ? (
              <EmptyState type="error" onRetry={() => fetchResults()} />
            ) : results.length === 0 ? (
              <EmptyState
                type={query ? "no-results" : "empty"}
                query={query}
                suggestions={["MRI Scan", "Blood Test", "X-Ray", "CT Scan"]}
              />
            ) : (
              <>
                <div
                  className={`grid gap-4 ${view === "list"
                    ? "grid-cols-1"
                    : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    }`}
                >
                  {processedResults.map(({ hospital, meta }) => (
                    <HospitalCard
                      key={hospital.id}
                      id={hospital.id}
                      name={hospital.name}
                      address={hospital.address}
                      district={hospital.district}
                      state={hospital.state}
                      pincode={hospital.pincode}
                      rating={meta.rating}
                      reviewCount={meta.reviewCount}
                      priceFrom={meta.priceFrom}
                      distance={meta.distance}
                      accreditation={meta.accreditation}
                      imageUrl={hospital.image_url}
                      isOpen={meta.isOpenNow}
                      onCompare={() => toggleCompare(hospital.id)}
                      onSave={() => toggleSave(hospital.id)}
                      isSaved={savedIds.has(hospital.id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="join">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          className={`btn btn-sm join-item ${page === pageNum ? "btn-active" : ""
                            }`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <button className="btn btn-sm join-item btn-disabled">
                          ...
                        </button>
                        <button
                          className={`btn btn-sm join-item ${page === totalPages ? "btn-active" : ""
                            }`}
                          onClick={() => handlePageChange(totalPages)}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Floating Compare Bar */}
      {compareIds.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-base-100 border-t border-base-200 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitCompare className="w-5 h-5 text-primary" />
              <span className="font-medium">{compareIds.size} hospital{compareIds.size > 1 ? "s" : ""} selected</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setCompareIds(new Set())}>
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
            <Link
              href={`/compare?ids=${Array.from(compareIds).join(",")}`}
              className={`btn btn-primary btn-sm ${compareIds.size < 2 ? "btn-disabled" : ""}`}
            >
              Compare Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
