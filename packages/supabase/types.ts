export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    phone_number: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            services: {
                Row: {
                    id: number
                    name: string
                    description: string | null
                    base_price: number
                    image_url: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: number
                    name: string
                    description?: string | null
                    base_price: number
                    image_url?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: number
                    name?: string
                    description?: string | null
                    base_price?: number
                    image_url?: string | null
                    is_active?: boolean
                    created_at?: string
                }
            }
            workers_public: {
                Row: {
                    id: string
                    full_name: string
                    profile_image_url: string | null
                    service_types: string[] | null
                    rating: number
                    total_reviews: number
                    hourly_rate: number | null
                    location: any | null // Geography point
                    is_verified: boolean
                    bio: string | null
                    is_online: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    full_name: string
                    profile_image_url?: string | null
                    service_types?: string[] | null
                    rating?: number
                    total_reviews?: number
                    hourly_rate?: number | null
                    location?: any | null
                    is_verified?: boolean
                    bio?: string | null
                    is_online?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    profile_image_url?: string | null
                    service_types?: string[] | null
                    rating?: number
                    total_reviews?: number
                    hourly_rate?: number | null
                    location?: any | null
                    is_verified?: boolean
                    bio?: string | null
                    is_online?: boolean
                    created_at?: string
                }
            }
            bookings: {
                Row: {
                    id: string
                    customer_id: string
                    worker_id: string | null
                    service_id: number
                    address_id: string | null
                    status: 'requested' | 'matched' | 'accepted' | 'en_route' | 'in_progress' | 'completed' | 'paid' | 'cancelled'
                    scheduled_at: string
                    duration_minutes: number | null
                    total_amount: number | null
                    notes: string | null
                    location: any | null // Geography Point
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    customer_id: string
                    worker_id?: string | null
                    service_id: number
                    address_id?: string | null
                    status?: 'requested' | 'matched' | 'accepted' | 'en_route' | 'in_progress' | 'completed' | 'paid' | 'cancelled'
                    scheduled_at: string
                    duration_minutes?: number | null
                    total_amount?: number | null
                    notes?: string | null
                    location?: any | null // Geography Point
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    customer_id?: string
                    worker_id?: string | null
                    service_id?: number
                    address_id?: string | null
                    status?: 'requested' | 'matched' | 'accepted' | 'en_route' | 'in_progress' | 'completed' | 'paid' | 'cancelled'
                    scheduled_at?: string
                    duration_minutes?: number | null
                    total_amount?: number | null
                    notes?: string | null
                    location?: any | null // Geography Point
                    created_at?: string
                    updated_at?: string
                }
            }
            recurring_bookings: {
                Row: {
                    id: string
                    user_id: string
                    service_ids: number[]
                    address_id: string
                    preferred_worker_id: string | null
                    rrule: string
                    timezone: string
                    start_date: string
                    end_date: string | null
                    max_occurrences: number | null
                    preferred_time_start: string
                    preferred_time_end: string
                    duration_minutes: number
                    price_snapshot: Json
                    total_per_occurrence: number
                    status: 'active' | 'paused' | 'cancelled' | 'completed'
                    stripe_customer_id: string | null
                    stripe_payment_method_id: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    service_ids: number[]
                    address_id: string
                    preferred_worker_id?: string | null
                    rrule: string
                    timezone?: string
                    start_date: string
                    end_date?: string | null
                    max_occurrences?: number | null
                    preferred_time_start: string
                    preferred_time_end: string
                    duration_minutes: number
                    price_snapshot: Json
                    total_per_occurrence: number
                    status?: 'active' | 'paused' | 'cancelled' | 'completed'
                    stripe_customer_id?: string | null
                    stripe_payment_method_id?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    service_ids?: number[]
                    address_id?: string
                    preferred_worker_id?: string | null
                    rrule?: string
                    timezone?: string
                    start_date?: string
                    end_date?: string | null
                    max_occurrences?: number | null
                    preferred_time_start?: string
                    preferred_time_end?: string
                    duration_minutes?: number
                    price_snapshot?: Json
                    total_per_occurrence?: number
                    status?: 'active' | 'paused' | 'cancelled' | 'completed'
                    stripe_customer_id?: string | null
                    stripe_payment_method_id?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            recurring_booking_occurrences: {
                Row: {
                    id: string
                    recurring_booking_id: string
                    occurrence_index: number
                    scheduled_for: string
                    booking_id: string | null
                    worker_id: string | null
                    status: 'pending' | 'scheduled' | 'created' | 'skipped' | 'failed'
                    failure_reason: string | null
                    retry_count: number
                    last_retry_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    recurring_booking_id: string
                    occurrence_index: number
                    scheduled_for: string
                    booking_id?: string | null
                    worker_id?: string | null
                    status?: 'pending' | 'scheduled' | 'created' | 'skipped' | 'failed'
                    failure_reason?: string | null
                    retry_count?: number
                    last_retry_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    recurring_booking_id?: string
                    occurrence_index?: number
                    scheduled_for?: string
                    booking_id?: string | null
                    worker_id?: string | null
                    status?: 'pending' | 'scheduled' | 'created' | 'skipped' | 'failed'
                    failure_reason?: string | null
                    retry_count?: number
                    last_retry_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            worker_recurring_preferences: {
                Row: {
                    id: string
                    worker_id: string
                    recurring_booking_id: string
                    accepts_series: boolean
                    blocked_dates: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    worker_id: string
                    recurring_booking_id: string
                    accepts_series?: boolean
                    blocked_dates?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    worker_id?: string
                    recurring_booking_id?: string
                    accepts_series?: boolean
                    blocked_dates?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
            }
            fcm_tokens: {
                Row: {
                    id: string
                    user_id: string
                    token: string
                    device_type: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    token: string
                    device_type?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    token?: string
                    device_type?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string | null
                    message: string | null
                    metadata: Json | null
                    is_read: boolean
                    created_at: string
                    priority: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    title?: string | null
                    message?: string | null
                    metadata?: Json | null
                    is_read?: boolean
                    created_at?: string
                    priority?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string | null
                    message?: string | null
                    metadata?: Json | null
                    is_read?: boolean
                    created_at?: string
                    priority?: string | null
                }
            }
            recurring_booking_audit_log: {
                Row: {
                    id: string
                    recurring_booking_id: string
                    occurrence_id: string | null
                    action: string
                    old_state: Json | null
                    new_state: Json | null
                    metadata: Json | null
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    recurring_booking_id: string
                    occurrence_id?: string | null
                    action: string
                    old_state?: Json | null
                    new_state?: Json | null
                    metadata?: Json | null
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    recurring_booking_id?: string
                    occurrence_id?: string | null
                    action?: string
                    old_state?: Json | null
                    new_state?: Json | null
                    metadata?: Json | null
                    created_by?: string | null
                    created_at?: string
                }
            }
            support_tickets: {
                Row: {
                    id: string
                    user_id: string | null
                    name: string
                    mobile: string
                    email: string
                    category: string
                    description: string
                    attachment_url: string | null
                    status: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    name: string
                    mobile: string
                    email: string
                    category: string
                    description: string
                    attachment_url?: string | null
                    status?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    name?: string
                    mobile?: string
                    email?: string
                    category?: string
                    description?: string
                    attachment_url?: string | null
                    status?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            nearby_workers: {
                Args: {
                    lat: number
                    lng: number
                    radius_meters?: number
                    service_filter?: string | null
                }
                Returns: {
                    id: string
                    full_name: string
                    rating: number
                    hourly_rate: number
                    dist_meters: number
                    is_verified: boolean
                    profile_image_url: string | null
                    service_types: string[]
                }[]
            }
            create_booking: {
                Args: {
                    customer_uuid?: string
                    service_id_input: number
                    address_id_input: string | null
                    scheduled_at_input: string
                    duration_minutes_input: number
                    preferred_worker_id_input?: string | null
                    notes_input?: string | null
                    location_input?: any | null // Geography Point
                }
                Returns: string
            }
            get_market_bookings: {
                Args: {
                    p_worker_id: string
                    p_radius_meters?: number
                }
                Returns: {
                    id: string
                    service_name: string
                    status: string
                    total_amount: number
                    scheduled_at: string
                    duration_minutes: number
                    address_line1: string
                    city: string
                    dist_meters: number
                    notes: string
                }[]
            }
            accept_booking: {
                Args: {
                    p_booking_id: string
                    p_worker_id: string
                }
                Returns: void
            }
            create_recurring_booking: {
                Args: {
                    p_user_id: string
                    p_service_ids: number[]
                    p_address_id: string
                    p_preferred_worker_id: string | null
                    p_rrule: string
                    p_timezone: string
                    p_start_date: string
                    p_end_date: string | null
                    p_max_occurrences: number | null
                    p_preferred_time_start: string
                    p_preferred_time_end: string
                    p_duration_minutes: number
                    p_notes?: string | null
                    p_stripe_customer_id?: string | null
                    p_stripe_payment_method_id?: string | null
                }
                Returns: string
            }
            manage_recurring_booking: {
                Args: {
                    p_recurring_id: string
                    p_action: string
                }
                Returns: boolean
            }
            skip_occurrence: {
                Args: {
                    p_occurrence_id: string
                    p_reason?: string | null
                }
                Returns: boolean
            }
            get_market_bookings_v2: {
                Args: {
                    p_worker_id?: string | null
                    p_limit?: number
                    p_radius_km?: number
                }
                Returns: {
                    id: string
                    booking_id: string
                    service_name: string
                    status: string
                    total_amount: number
                    scheduled_at: string
                    duration_minutes: number
                    address_line1: string
                    city: string
                    dist_meters: number
                    notes: string
                    is_location_estimated: boolean
                }[]
            }
            get_market_subscriptions: {
                Args: {
                    p_worker_id?: string | null
                    p_radius_km?: number
                }
                Returns: {
                    id: string
                    user_id: string
                    service_names: string[]
                    rrule: string
                    start_date: string
                    end_date: string | null
                    preferred_time_start: string
                    total_per_occurrence: number
                    address_line1: string
                    city: string
                    dist_meters: number
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
