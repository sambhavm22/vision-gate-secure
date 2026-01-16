import { Toaster } from "@vision-gate/ui";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuditLogs from "./pages/AuditLogs";
import Bookings from "./pages/Bookings";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
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
                        <Route path="audit-logs" element={<AuditLogs />} />
                        <Route path="/settings" element={<div>Settings Placeholder</div>} />
                    </Route>
                </Route>
            </Routes>
            <Toaster />
        </Router>
    );
}

export default App;
