const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export type Hospital = {
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
};

export interface SearchParams {
    query?: string | null;
    state?: string | null;
    district?: string | null;
    pincode?: string | null;
    limit?: number;
    page?: number;
}

export interface SearchResult {
    results: Hospital[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export async function searchHospitals(params: SearchParams): Promise<SearchResult> {
    const { query, state, district, pincode, limit = 10, page = 1 } = params;

    const url = new URL(`${BACKEND_URL}/api/search/hospitals`);
    if (query) url.searchParams.set("q", query);
    if (state) url.searchParams.set("state", state);
    if (district) url.searchParams.set("district", district);
    if (pincode) url.searchParams.set("pincode", pincode);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("page", String(page));

    const response = await fetch(url.toString());
    if (!response.ok) {
        return { results: [], total: 0, page, limit, totalPages: 0 };
    }
    const data = await response.json();
    return {
        results: data.results ?? [],
        total: data.total ?? 0,
        page: data.page ?? page,
        limit: data.limit ?? limit,
        totalPages: data.totalPages ?? 0,
    };
}

