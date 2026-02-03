/**
 * Hook to get the current authenticated user
 */

import type { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface UseUserReturn {
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: Error | null;
}

export function useUser(): UseUserReturn {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session: currentSession }, error: sessionError } =
                    await supabase.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                setSession(currentSession);
                setUser(currentSession?.user ?? null);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to get session'));
            } finally {
                setLoading(false);
            }
        };

        getInitialSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { user, session, loading, error };
}

/**
 * Helper to get user display name from user metadata
 */
export function getUserDisplayName(user: User | null): string {
    if (!user) return '';

    // Try different metadata fields that might contain the name
    const metadata = user.user_metadata || {};
    return (
        metadata.name ||
        metadata.full_name ||
        metadata.display_name ||
        user.email?.split('@')[0] || // Fallback to email username
        'User'
    );
}
