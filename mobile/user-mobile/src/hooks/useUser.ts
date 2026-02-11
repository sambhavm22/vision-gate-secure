/**
 * Hook to get the current authenticated user
 */

import type { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
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

        // Handle Deep Linking for OAuth
        const handleDeepLink = async (url: string | null) => {
            if (!url) return;

            try {
                // Parse the URL to get the hash fragment
                // user-mobile://login-callback#access_token=...&refresh_token=...
                // The URL polyfill might not handle custom schemes perfectly, so we can do manual parsing for safety
                if (url.includes('access_token') && url.includes('refresh_token')) {
                    const hashIndex = url.indexOf('#');
                    if (hashIndex !== -1) {
                        const fragment = url.substring(hashIndex + 1);
                        const params = new URLSearchParams(fragment);
                        const access_token = params.get('access_token');
                        const refresh_token = params.get('refresh_token');

                        if (access_token && refresh_token) {
                            const { error } = await supabase.auth.setSession({
                                access_token,
                                refresh_token,
                            });
                            if (error) throw error;
                        }
                    }
                }
            } catch (err) {
                console.error('Deep Link Error:', err);
                setError(err instanceof Error ? err : new Error('Failed to handle deep link'));
            }
        };

        // 1. Handle app launch from deep link
        Linking.getInitialURL().then(handleDeepLink);

        // 2. Handle deep link when app is already open
        const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        return () => {
            subscription.unsubscribe();
            linkingSubscription.remove();
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
