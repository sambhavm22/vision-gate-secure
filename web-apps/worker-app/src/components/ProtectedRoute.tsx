import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, requireProfile = true }: { children: ReactNode; requireProfile?: boolean }) {
    const { user, workerProfile, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user is logged in, but we require a profile and they don't have one
    if (requireProfile && !workerProfile) {
        return <Navigate to="/onboarding" replace />;
    }

    // If user is on onboarding but already has a profile, redirect to dashboard
    if (!requireProfile && workerProfile && location.pathname === '/onboarding') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
