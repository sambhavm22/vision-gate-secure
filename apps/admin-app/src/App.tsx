import { Toaster } from "@vision-gate/ui";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuditLogs from "./pages/AuditLogs";
import Bookings from "./pages/Bookings";
import Dashboard from "./pages/Dashboard";
import Issues from "./pages/Issues";
import Login from "./pages/Login";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Workers from "./pages/Workers";

function App() {
    return (
        <Router>
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
            <Toaster />
        </Router>
    );
}

export default App;
