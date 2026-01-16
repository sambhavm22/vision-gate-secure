export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
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
                Relationships: [
                    {
                        foreignKeyName: "addresses_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            admin_audit_logs: {
                Row: {
                    action: string
                    admin_id: string | null
                    created_at: string | null
                    entity_id: string
                    entity_type: string
                    id: string
                    new_data: Json | null
                    old_data: Json | null
                    reason: string | null
                }
                Insert: {
                    action: string
                    admin_id?: string | null
                    created_at?: string | null
                    entity_id: string
                    entity_type: string
                    id?: string
                    new_data?: Json | null
                    old_data?: Json | null
                    reason?: string | null
                }
                Update: {
                    action?: string
                    admin_id?: string | null
                    created_at?: string | null
                    entity_id?: string
                    entity_type?: string
                    id?: string
                    new_data?: Json | null
                    old_data?: Json | null
                    reason?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "admin_audit_logs_admin_id_fkey"
                        columns: ["admin_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            admin_users: {
                Row: {
                    created_at: string | null
                    id: string
                    role: string
                }
                Insert: {
                    created_at?: string | null
                    id: string
                    role: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    role?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "admin_users_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            bookings: {
                Row: {
                    created_at: string | null
                    customer_id: string
                    duration_minutes: number
                    id: string
                    location: unknown
                    notes: string | null
                    rejected_worker_ids: string[] | null
                    scheduled_at: string
                    service_id: string
                    service_name: string
                    status: string | null
                    total_amount: number | null
                    updated_at: string | null
                    worker_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    customer_id: string
                    duration_minutes: number
                    id?: string
                    location: unknown
                    notes?: string | null
                    rejected_worker_ids?: string[] | null
                    scheduled_at: string
                    service_id: string
                    service_name: string
                    status?: string | null
                    total_amount?: number | null
                    updated_at?: string | null
                    worker_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    customer_id?: string
                    duration_minutes?: number
                    id?: string
                    location?: unknown
                    notes?: string | null
                    rejected_worker_ids?: string[] | null
                    scheduled_at?: string
                    service_id?: string
                    service_name?: string
                    status?: string | null
                    total_amount?: number | null
                    updated_at?: string | null
                    worker_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "bookings_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_service_id_fkey"
                        columns: ["service_id"]
                        isOneToOne: false
                        referencedRelation: "services"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_worker_id_fkey"
                        columns: ["worker_id"]
                        isOneToOne: false
                        referencedRelation: "workers_public"
                        referencedColumns: ["id"]
                    },
                ]
            }
            customer_preferred_workers: {
                Row: {
                    created_at: string | null
                    customer_id: string
                    id: string
                    worker_id: string
                }
                Insert: {
                    created_at?: string | null
                    customer_id: string
                    id?: string
                    worker_id: string
                }
                Update: {
                    created_at?: string | null
                    customer_id?: string
                    id?: string
                    worker_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "customer_preferred_workers_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "customer_preferred_workers_worker_id_fkey"
                        columns: ["worker_id"]
                        isOneToOne: false
                        referencedRelation: "workers_public"
                        referencedColumns: ["id"]
                    },
                ]
            }
            export_logs: {
                Row: {
                    created_at: string | null
                    file_path: string | null
                    format: string
                    from_date: string | null
                    id: string
                    role: string
                    to_date: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    file_path?: string | null
                    format: string
                    from_date?: string | null
                    id?: string
                    role: string
                    to_date?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    file_path?: string | null
                    format?: string
                    from_date?: string | null
                    id?: string
                    role?: string
                    to_date?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "export_logs_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            fcm_tokens: {
                Row: {
                    created_at: string | null
                    id: string
                    token: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    token: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    token?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "fcm_tokens_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    created_at: string | null
                    id: string
                    is_read: boolean | null
                    message: string
                    title: string
                    type: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    message: string
                    title: string
                    type: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    message?: string
                    title?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            otp_verifications: {
                Row: {
                    code: string
                    created_at: string | null
                    expires_at: string
                    id: string
                    phone: string
                    verified_at: string | null
                }
                Insert: {
                    code: string
                    created_at?: string | null
                    expires_at: string
                    id?: string
                    phone: string
                    verified_at?: string | null
                }
                Update: {
                    code?: string
                    created_at?: string | null
                    expires_at?: string
                    id?: string
                    phone?: string
                    verified_at?: string | null
                }
                Relationships: []
            }
            payments: {
                Row: {
                    amount: number
                    booking_id: string | null
                    created_at: string | null
                    currency: string | null
                    id: string
                    provider: string | null
                    provider_order_id: string | null
                    provider_payment_id: string | null
                    status: string | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    amount: number
                    booking_id?: string | null
                    created_at?: string | null
                    currency?: string | null
                    id?: string
                    provider?: string | null
                    provider_order_id?: string | null
                    provider_payment_id?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    amount?: number
                    booking_id?: string | null
                    created_at?: string | null
                    currency?: string | null
                    id?: string
                    provider?: string | null
                    provider_order_id?: string | null
                    provider_payment_id?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "payments_booking_id_fkey"
                        columns: ["booking_id"]
                        isOneToOne: false
                        referencedRelation: "bookings"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
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
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            recurring_booking_audit_log: {
                Row: {
                    action_type: string
                    created_at: string | null
                    created_by: string | null
                    id: string
                    new_status: string | null
                    old_status: string | null
                    reason: string | null
                    recurring_booking_id: string | null
                }
                Insert: {
                    action_type: string
                    created_at?: string | null
                    created_by?: string | null
                    id?: string
                    new_status?: string | null
                    old_status?: string | null
                    reason?: string | null
                    recurring_booking_id?: string | null
                }
                Update: {
                    action_type?: string
                    created_at?: string | null
                    created_by?: string | null
                    id?: string
                    new_status?: string | null
                    old_status?: string | null
                    reason?: string | null
                    recurring_booking_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "recurring_booking_audit_log_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "recurring_booking_audit_log_recurring_booking_id_fkey"
                        columns: ["recurring_booking_id"]
                        isOneToOne: false
                        referencedRelation: "recurring_bookings"
                        referencedColumns: ["id"]
                    },
                ]
            }
            recurring_booking_occurrences: {
                Row: {
                    booking_id: string | null
                    id: string
                    recurring_booking_id: string | null
                    scheduled_at: string
                    status: Database["public"]["Enums"]["occurrence_status"] | null
                }
                Insert: {
                    booking_id?: string | null
                    id?: string
                    recurring_booking_id?: string | null
                    scheduled_at: string
                    status?: Database["public"]["Enums"]["occurrence_status"] | null
                }
                Update: {
                    booking_id?: string | null
                    id?: string
                    recurring_booking_id?: string | null
                    scheduled_at?: string
                    status?: Database["public"]["Enums"]["occurrence_status"] | null
                }
                Relationships: [
                    {
                        foreignKeyName: "recurring_booking_occurrences_booking_id_fkey"
                        columns: ["booking_id"]
                        isOneToOne: false
                        referencedRelation: "bookings"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "recurring_booking_occurrences_recurring_booking_id_fkey"
                        columns: ["recurring_booking_id"]
                        isOneToOne: false
                        referencedRelation: "recurring_bookings"
                        referencedColumns: ["id"]
                    },
                ]
            }
            recurring_bookings: {
                Row: {
                    created_at: string | null
                    duration_minutes: number
                    end_date: string | null
                    id: string
                    last_occurrence_generated: string | null
                    next_occurrence_at: string | null
                    notes: string | null
                    rrule: string
                    service_id: string
                    start_date: string
                    status: Database["public"]["Enums"]["recurring_booking_status"] | null
                    tags: string[] | null
                    time_of_day: string
                    total_occurrences: number | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    duration_minutes: number
                    end_date?: string | null
                    id?: string
                    last_occurrence_generated?: string | null
                    next_occurrence_at?: string | null
                    notes?: string | null
                    rrule: string
                    service_id: string
                    start_date: string
                    status?: Database["public"]["Enums"]["recurring_booking_status"] | null
                    tags?: string[] | null
                    time_of_day: string
                    total_occurrences?: number | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    duration_minutes?: number
                    end_date?: string | null
                    id?: string
                    last_occurrence_generated?: string | null
                    next_occurrence_at?: string | null
                    notes?: string | null
                    rrule?: string
                    service_id?: string
                    start_date?: string
                    status?: Database["public"]["Enums"]["recurring_booking_status"] | null
                    tags?: string[] | null
                    time_of_day?: string
                    total_occurrences?: number | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "recurring_bookings_service_id_fkey"
                        columns: ["service_id"]
                        isOneToOne: false
                        referencedRelation: "services"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "recurring_bookings_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            reviews: {
                Row: {
                    booking_id: string | null
                    comment: string | null
                    created_at: string | null
                    id: string
                    rating: number | null
                    reviewer_id: string | null
                    worker_id: string | null
                }
                Insert: {
                    booking_id?: string | null
                    comment?: string | null
                    created_at?: string | null
                    id?: string
                    rating?: number | null
                    reviewer_id?: string | null
                    worker_id?: string | null
                }
                Update: {
                    booking_id?: string | null
                    comment?: string | null
                    created_at?: string | null
                    id?: string
                    rating?: number | null
                    reviewer_id?: string | null
                    worker_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "reviews_booking_id_fkey"
                        columns: ["booking_id"]
                        isOneToOne: false
                        referencedRelation: "bookings"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "reviews_reviewer_id_fkey"
                        columns: ["reviewer_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "reviews_worker_id_fkey"
                        columns: ["worker_id"]
                        isOneToOne: false
                        referencedRelation: "workers_public"
                        referencedColumns: ["id"]
                    },
                ]
            }
            services: {
                Row: {
                    category: string
                    created_at: string | null
                    description: string | null
                    id: string
                    image_url: string | null
                    name: string
                    price_per_hour: number
                }
                Insert: {
                    category: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    name: string
                    price_per_hour: number
                }
                Update: {
                    category?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    name?: string
                    price_per_hour?: number
                }
                Relationships: []
            }
            support_tickets: {
                Row: {
                    created_at: string | null
                    description: string
                    id: string
                    status: string | null
                    subject: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    description: string
                    id?: string
                    status?: string | null
                    subject: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    description?: string
                    id?: string
                    status?: string | null
                    subject?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "support_tickets_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            transactions: {
                Row: {
                    amount: number
                    booking_id: string | null
                    created_at: string | null
                    id: string
                    payment_method: string | null
                    status: string | null
                    user_id: string | null
                }
                Insert: {
                    amount: number
                    booking_id?: string | null
                    created_at?: string | null
                    id?: string
                    payment_method?: string | null
                    status?: string | null
                    user_id?: string | null
                }
                Update: {
                    amount?: number
                    booking_id?: string | null
                    created_at?: string | null
                    id?: string
                    payment_method?: string | null
                    status?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_booking_id_fkey"
                        columns: ["booking_id"]
                        isOneToOne: false
                        referencedRelation: "bookings"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_devices: {
                Row: {
                    created_at: string | null
                    id: string
                    last_active: string | null
                    os: string | null
                    platform: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    last_active?: string | null
                    os?: string | null
                    platform?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    last_active?: string | null
                    os?: string | null
                    platform?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_devices_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            worker_availability_blocks: {
                Row: {
                    created_at: string | null
                    end_time: string
                    id: string
                    reason: string | null
                    start_time: string
                    worker_id: string
                }
                Insert: {
                    created_at?: string | null
                    end_time: string
                    id?: string
                    reason?: string | null
                    start_time: string
                    worker_id: string
                }
                Update: {
                    created_at?: string | null
                    end_time?: string
                    id?: string
                    reason?: string | null
                    start_time?: string
                    worker_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "worker_availability_blocks_worker_id_fkey"
                        columns: ["worker_id"]
                        isOneToOne: false
                        referencedRelation: "workers_public"
                        referencedColumns: ["id"]
                    },
                ]
            }
            worker_recurring_preferences: {
                Row: {
                    created_at: string | null
                    id: string
                    is_active: boolean | null
                    max_daily_recurring: number | null
                    preferred_days: number[] | null
                    updated_at: string | null
                    worker_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    max_daily_recurring?: number | null
                    preferred_days?: number[] | null
                    updated_at?: string | null
                    worker_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    max_daily_recurring?: number | null
                    preferred_days?: number[] | null
                    updated_at?: string | null
                    worker_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "worker_recurring_preferences_worker_id_fkey"
                        columns: ["worker_id"]
                        isOneToOne: true
                        referencedRelation: "workers_public"
                        referencedColumns: ["id"]
                    },
                ]
            }
            workers_public: {
                Row: {
                    bio: string | null
                    created_at: string | null
                    full_name: string
                    id: string
                    is_online: boolean | null
                    is_verified: boolean | null
                    last_active: string | null
                    location: unknown
                    phone: string | null
                    rating: number | null
                    service_types: string[] | null
                    status: string | null
                    total_reviews: number | null
                }
                Insert: {
                    bio?: string | null
                    created_at?: string | null
                    full_name: string
                    id: string
                    is_online?: boolean | null
                    is_verified?: boolean | null
                    last_active?: string | null
                    location: unknown
                    phone?: string | null
                    rating?: number | null
                    service_types?: string[] | null
                    status?: string | null
                    total_reviews?: number | null
                }
                Update: {
                    bio?: string | null
                    created_at?: string | null
                    full_name?: string
                    id?: string
                    is_online?: boolean | null
                    is_verified?: boolean | null
                    last_active?: string | null
                    location?: unknown
                    phone?: string | null
                    rating?: number | null
                    service_types?: string[] | null
                    status?: string | null
                    total_reviews?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "workers_public_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            zip_centroids: {
                Row: {
                    city: string | null
                    geom: unknown | null
                    id: number
                    lat: number | null
                    lng: number | null
                    state: string | null
                    zip_code: string | null
                }
                Insert: {
                    city?: string | null
                    geom?: unknown | null
                    id?: number
                    lat?: number | null
                    lng?: number | null
                    state?: string | null
                    zip_code?: string | null
                }
                Update: {
                    city?: string | null
                    geom?: unknown | null
                    id?: number
                    lat?: number | null
                    lng?: number | null
                    state?: string | null
                    zip_code?: string | null
                }
                Relationships: []
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
            occurrence_status: "pending" | "scheduled" | "created" | "skipped" | "failed"
            recurring_booking_status: "active" | "paused" | "cancelled" | "completed"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
