export type WorkerProfile = {
    id: string;
    user_id: string;
    full_name: string;
    profile_image_url?: string;
    service_types: string[];
    rating: number;
    total_reviews: number;
    hourly_rate?: number;
    is_verified: boolean;
    bio?: string;
    created_at: string;
};

export type Booking = {
    id: string;
    service_id: number;
    address_id: string;
    customer_id: string;
    worker_id?: string;
    status: 'requested' | 'matched' | 'accepted' | 'en_route' | 'in_progress' | 'completed' | 'paid' | 'cancelled';
    scheduled_at: string;
    duration_minutes: number;
    total_amount: number;
    notes?: string;
    created_at: string;
    service?: {
        name: string;
        base_price: number;
    };
    address?: {
        address_line1: string;
        city: string;
        location: any;
    };
};

export type RecurringBooking = {
    id: string;
    rrule: string;
    start_date: string;
    end_date: string | null;
    preferred_time_start: string;
    duration_minutes: number;
    total_per_occurrence: number;
    status: 'active' | 'paused' | 'cancelled' | 'completed';
    address?: {
        address_line1: string;
        city: string;
    };
    service_ids: number[];
    service_name?: string; // Optional if we join
};
