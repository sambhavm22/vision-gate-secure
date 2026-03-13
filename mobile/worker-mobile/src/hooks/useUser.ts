/**
 * Hook to get the current authenticated worker user
 */

import type { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export interface WorkerProfile {
    id: string;
    user_id?: string | null;
    full_name: string;
    phone: string | null;
    bio: string | null;
    is_online: boolean;
    is_verified: boolean;
    rating: number | null;
    total_reviews: number | null;
    service_types: string[] | null;
    location: unknown;
    status: string | null;
    last_active: string | null;
    created_at: string | null;
}

interface UseUserReturn {
    user: User | null;
    session: Session | null;
    workerProfile: WorkerProfile | null;
    loading: boolean;
    error: Error | null;
    refreshProfile: () => Promise<void>;
}

export function useUser(): UseUserReturn {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchWorkerProfile = async (userId: string) => {
        try {
            await (supabase.rpc as any)('claim_worker_profile');

            const { data, error: fetchError } = await supabase
                .from('workers_public')
                .select('*')
                .or(`user_id.eq.${userId},id.eq.${userId}`)
                .limit(1)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching worker profile:', fetchError);
            }
            setWorkerProfile(data as WorkerProfile | null);
        } catch (err) {
            console.error('Worker profile fetch error:', err);
        }
    };

    useEffect(() => {
        const getInitialSession = async () => {
            try {
                const { data: { session: currentSession }, error: sessionError } =
                    await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    await fetchWorkerProfile(currentSession.user.id);
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to get session'));
            } finally {
                setLoading(false);
            }
        };

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                if (newSession?.user) {
                    await fetchWorkerProfile(newSession.user.id);
                } else {
                    setWorkerProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const refreshProfile = async () => {
        if (user) await fetchWorkerProfile(user.id);
    };

    return { user, session, workerProfile, loading, error, refreshProfile };
}
