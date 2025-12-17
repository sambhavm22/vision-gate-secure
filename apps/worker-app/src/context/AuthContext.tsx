import type { WorkerProfile } from "@/types";
import { type Session, type User } from "@supabase/supabase-js";
import { supabase } from "@vision-gate/supabase/client";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    workerProfile: WorkerProfile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchWorkerProfile(session.user.id);
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error initializing auth:", error);
                setIsLoading(false);
            }
        };

        initAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchWorkerProfile(session.user.id);
            } else {
                setWorkerProfile(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchWorkerProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("workers_public")
                // @ts-ignore
                .select("*")
                .eq("id", userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is code for no rows found
                console.error("Error fetching worker profile:", error);
            }

            setWorkerProfile(data);
        } catch (err) {
            console.error("Context error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user) await fetchWorkerProfile(user.id);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, workerProfile, isLoading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
