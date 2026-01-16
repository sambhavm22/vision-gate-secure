import { supabase } from "@vision-gate/supabase/client";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        async function checkAdmin() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: admin } = await supabase
                    .from("admin_users")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();

                if (admin) setIsAdmin(true);
            }
            setLoading(false);
        }
        checkAdmin();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}
