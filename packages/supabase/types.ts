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
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
