import type { Database } from './types';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase client: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables.');
}

export const supabase = createClient<Database>(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY || 'placeholder',
    {
        auth: {
            storage: localStorage,
            persistSession: true,
            autoRefreshToken: true,
        }
    }
);
