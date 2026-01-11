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
            addresses: {
                Row: {
                    address_line1: string
                    address_line2: string | null
                    city: string | null
                    created_at: string | null
                    customer_id: string
                    id: string
                    label: string | null
                    lat: number | null
                    lng: number | null
                    location: unknown
                    postal_code: number | null
                }
                Insert: {
                    address_line1: string
                    address_line2?: string | null
                    city?: string | null
                    created_at?: string | null
                    customer_id: string
                    id?: string
                    label?: string | null
                    lat?: number | null
                    lng?: number | null
                    location?: unknown
                    postal_code?: number | null
                }
                Update: {
                    address_line1?: string
                    address_line2?: string | null
                    city?: string | null
                    created_at?: string | null
                    customer_id?: string
                    id?: string
                    label?: string | null
                    lat?: number | null
                    lng?: number | null
                    location?: unknown
                    postal_code?: number | null
                }
            }
            bookings: {
                Row: {
                    address_id: string | null
                    created_at: string | null
                    customer_id: string
                    duration_minutes: number | null
                    id: string
                    location: unknown | null
                    notes: string | null
                    reminder_sent: boolean | null
                    scheduled_at: string
                    status: string | null
                    total_amount: number | null
                    updated_at: string | null
                    worker_id: string | null
                }
                Insert: {
                    address_id?: string | null
                    created_at?: string | null
                    customer_id: string
                    duration_minutes?: number | null
                    id?: string
                    location?: unknown | null
                    notes?: string | null
                    reminder_sent?: boolean | null
                    scheduled_at: string
                    status?: string | null
                    total_amount?: number | null
                    updated_at?: string | null
                    worker_id?: string | null
                }
                Update: {
                    address_id?: string | null
                    created_at?: string | null
                    customer_id?: string
                    duration_minutes?: number | null
                    id?: string
                    location?: unknown | null
                    notes?: string | null
                    reminder_sent?: boolean | null
                    scheduled_at?: string
                    status?: string | null
                    total_amount?: number | null
                    updated_at?: string | null
                    worker_id?: string | null
                }
            }
            fcm_tokens: {
                Row: {
                    created_at: string | null
                    device_type: string | null
                    id: string
                    token: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    device_type?: string | null
                    id?: string
                    token: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    device_type?: string | null
                    id?: string
                    token?: string
                    updated_at?: string | null
                    user_id?: string
                }
            }
            notifications: {
                Row: {
                    created_at: string | null
                    id: string
                    is_read: boolean
                    message: string | null
                    metadata: Json | null
                    priority: string | null
                    title: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_read?: boolean
                    message?: string | null
                    metadata?: Json | null
                    priority?: string | null
                    title?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_read?: boolean
                    message?: string | null
                    metadata?: Json | null
                    priority?: string | null
                    title?: string | null
                    user_id?: string
                }
            }
            profiles: {
                Row: {
                    address: string | null
                    avatar_url: string | null
                    city: string | null
                    created_at: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    phone: string | null
                    role: Database["public"]["Enums"]["app_role"] | null
                    updated_at: string | null
                }
                Insert: {
                    address?: string | null
                    avatar_url?: string | null
                    city?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    phone?: string | null
                    role?: Database["public"]["Enums"]["app_role"] | null
                    updated_at?: string | null
                }
                Update: {
                    address?: string | null
                    avatar_url?: string | null
                    city?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    phone?: string | null
                    role?: Database["public"]["Enums"]["app_role"] | null
                    updated_at?: string | null
                }
            }
            recurring_booking_audit_log: {
                Row: {
                    action: string
                    created_at: string | null
                    created_by: string | null
                    id: string
                    metadata: Json | null
                    new_state: Json | null
                    occurrence_id: string | null
                    old_state: Json | null
                    recurring_booking_id: string
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    created_by?: string | null
                    id?: string
                    metadata?: Json | null
                    new_state?: Json | null
                    occurrence_id?: string | null
                    old_state?: Json | null
                    recurring_booking_id: string
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    created_by?: string | null
                    id?: string
                    metadata?: Json | null
                    new_state?: Json | null
                    occurrence_id?: string | null
                    old_state?: Json | null
                    recurring_booking_id?: string
                }
            }
            recurring_booking_occurrences: {
                Row: {
                    booking_id: string | null
                    created_at: string | null
                    failure_reason: string | null
                    id: string
                    last_retry_at: string | null
                    occurrence_index: number
                    recurring_booking_id: string
                    retry_count: number | null
                    scheduled_for: string
                    status: Database["public"]["Enums"]["occurrence_status"] | null
                    updated_at: string | null
                    worker_id: string | null
                }
                Insert: {
                    booking_id?: string | null
                    created_at?: string | null
                    failure_reason?: string | null
                    id?: string
                    last_retry_at?: string | null
                    occurrence_index: number
                    recurring_booking_id: string
                    retry_count?: number | null
                    scheduled_for: string
                    status?: Database["public"]["Enums"]["occurrence_status"] | null
                    updated_at?: string | null
                    worker_id?: string | null
                }
                Update: {
                    booking_id?: string | null
                    created_at?: string | null
                    failure_reason?: string | null
                    id?: string
                    last_retry_at?: string | null
                    occurrence_index?: number
                    recurring_booking_id?: string
                    retry_count?: number | null
                    scheduled_for?: string
                    status?: Database["public"]["Enums"]["occurrence_status"] | null
                    updated_at?: string | null
                    worker_id?: string | null
                }
            }
            recurring_bookings: {
                Row: {
                    address_id: string
                    created_at: string | null
                    duration_minutes: number
                    end_date: string | null
                    id: string
                    max_occurrences: number | null
                    notes: string | null
                    preferred_time_end: string
                    preferred_time_start: string
                    preferred_worker_id: string | null
                    price_snapshot: Json
                    rrule: string
                    start_date: string
                    status: Database["public"]["Enums"]["recurring_booking_status"] | null
                    stripe_customer_id: string | null
                    stripe_payment_method_id: string | null
                    timezone: string
                    total_per_occurrence: number
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    address_id: string
                    created_at?: string | null
                    duration_minutes: number
                    end_date?: string | null
                    id?: string
                    max_occurrences?: number | null
                    notes?: string | null
                    preferred_time_end: string
                    preferred_time_start: string
                    preferred_worker_id?: string | null
                    price_snapshot: Json
                    rrule: string
                    start_date: string
                    status?: Database["public"]["Enums"]["recurring_booking_status"] | null
                    stripe_customer_id?: string | null
                    stripe_payment_method_id?: string | null
                    timezone?: string
                    total_per_occurrence: number
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    address_id?: string
                    created_at?: string | null
                    duration_minutes?: number
                    end_date?: string | null
                    id?: string
                    max_occurrences?: number | null
                    notes?: string | null
                    preferred_time_end?: string
                    preferred_time_start?: string
                    preferred_worker_id?: string | null
                    price_snapshot?: Json
                    rrule?: string
                    start_date?: string
                    status?: Database["public"]["Enums"]["recurring_booking_status"] | null
                    stripe_customer_id?: string | null
                    stripe_payment_method_id?: string | null
                    timezone?: string
                    total_per_occurrence?: number
                    updated_at?: string | null
                    user_id?: string
                }
            }
            reviews: {
                Row: {
                    booking_id: string
                    comment: string | null
                    created_at: string | null
                    id: string
                    rating: number
                    reviewer_id: string
                    worker_id: string
                }
                Insert: {
                    booking_id: string
                    comment?: string | null
                    created_at?: string | null
                    id?: string
                    rating: number
                    reviewer_id: string
                    worker_id: string
                }
                Update: {
                    booking_id?: string
                    comment?: string | null
                    created_at?: string | null
                    id?: string
                    rating?: number
                    reviewer_id?: string
                    worker_id?: string
                }
            }
            services: {
                Row: {
                    base_price: number
                    created_at: string | null
                    description: string | null
                    id: number
                    image_url: string | null
                    is_active: boolean | null
                    name: string
                }
                Insert: {
                    base_price: number
                    created_at?: string | null
                    description?: string | null
                    id?: number
                    image_url?: string | null
                    is_active?: boolean | null
                    name: string
                }
                Update: {
                    base_price?: number
                    created_at?: string | null
                    description?: string | null
                    id?: number
                    image_url?: string | null
                    is_active?: boolean | null
                    name?: string
                }
            }
            support_tickets: {
                Row: {
                    attachment_url: string | null
                    category: string
                    created_at: string | null
                    description: string
                    email: string
                    id: string
                    mobile: string
                    name: string
                    status: string | null
                    user_id: string | null
                }
                Insert: {
                    attachment_url?: string | null
                    category: string
                    created_at?: string | null
                    description: string
                    email: string
                    id?: string
                    mobile: string
                    name: string
                    status?: string | null
                    user_id?: string | null
                }
                Update: {
                    attachment_url?: string | null
                    category?: string
                    created_at?: string | null
                    description?: string
                    email?: string
                    id?: string
                    mobile?: string
                    name?: string
                    status?: string | null
                    user_id?: string | null
                }
            }
            user_devices: {
                Row: {
                    created_at: string | null
                    device_token: string
                    id: string
                    last_seen_at: string | null
                    platform: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    device_token: string
                    id?: string
                    last_seen_at?: string | null
                    platform?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    device_token?: string
                    id?: string
                    last_seen_at?: string | null
                    platform?: string | null
                    user_id?: string
                }
            }
            worker_recurring_preferences: {
                Row: {
                    accepts_series: boolean | null
                    blocked_dates: string[] | null
                    created_at: string | null
                    id: string
                    recurring_booking_id: string
                    updated_at: string | null
                    worker_id: string
                }
                Insert: {
                    accepts_series?: boolean | null
                    blocked_dates?: string[] | null
                    created_at?: string | null
                    id?: string
                    recurring_booking_id: string
                    updated_at?: string | null
                    worker_id: string
                }
                Update: {
                    accepts_series?: boolean | null
                    blocked_dates?: string[] | null
                    created_at?: string | null
                    id?: string
                    recurring_booking_id?: string
                    updated_at?: string | null
                    worker_id?: string
                }
            }
            workers_public: {
                Row: {
                    bio: string | null
                    created_at: string | null
                    full_name: string
                    hourly_rate: number | null
                    id: string
                    is_online: boolean | null
                    is_verified: boolean | null
                    location: unknown | null
                    profile_image_url: string | null
                    rating: number | null
                    service_types: string[] | null
                    total_reviews: number | null
                    user_id: string | null
                }
                Insert: {
                    bio?: string | null
                    created_at?: string | null
                    full_name: string
                    hourly_rate?: number | null
                    id?: string
                    is_online?: boolean | null
                    is_verified?: boolean | null
                    location?: unknown | null
                    profile_image_url?: string | null
                    rating?: number | null
                    service_types?: string[] | null
                    total_reviews?: number | null
                    user_id?: string | null
                }
                Update: {
                    bio?: string | null
                    created_at?: string | null
                    full_name?: string
                    hourly_rate?: number | null
                    id?: string
                    is_online?: boolean | null
                    is_verified?: boolean | null
                    location?: unknown | null
                    profile_image_url?: string | null
                    rating?: number | null
                    service_types?: string[] | null
                    total_reviews?: number | null
                    user_id?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            app_role: "admin" | "user" | "worker"
            occurrence_status:
            | "pending"
            | "scheduled"
            | "created"
            | "skipped"
            | "failed"
            recurring_booking_status: "active" | "paused" | "cancelled" | "completed"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
