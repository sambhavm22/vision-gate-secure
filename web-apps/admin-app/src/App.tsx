import { Toaster } from "@vision-gate/ui";
import { Suspense, lazy } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import { PageLoader } from "./components/PageLoader";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy loaded components
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Workers = lazy(() => import("./pages/Workers"));
const Users = lazy(() => import("./pages/Users"));
const Payments = lazy(() => import("./pages/Payments"));
const Reports = lazy(() => import("./pages/Reports"));
const Issues = lazy(() => import("./pages/Issues"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Login = lazy(() => import("./pages/Login"));

function App() {
    return (
        <Router>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Protected Admin Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/bookings" element={<Bookings />} />
                            <Route path="/workers" element={<Workers />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/payments" element={<Payments />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/issues" element={<Issues />} />
                            <Route path="/audit-logs" element={<AuditLogs />} />
                            <Route path="/settings" element={<div className="text-muted-foreground">Settings coming soon...</div>} />
                        </Route>
                    </Route>
                </Routes>
            </Suspense>
            <Toaster />
        </Router>
    );
}

export default App;
