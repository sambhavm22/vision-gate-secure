/**
 * Supabase client for React Native
 * Uses AsyncStorage for session persistence
 */

// URL polyfill required for Supabase in React Native
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// TODO: Move to environment variables
// For now using placeholders - replace with your actual Supabase credentials
// TEMP ONLY – move to env variables
const SUPABASE_URL = "https://vviyjdazrnbbxypxcuxf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2aXlqZGF6cm5iYnh5cHhjdXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjEwMjcsImV4cCI6MjA4MDMzNzAyN30.D7CYp3IyMCJUZmDZThOaIAIQ3_kGKAyAeZlbuN9-dCs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Not needed for React Native
    },
});
