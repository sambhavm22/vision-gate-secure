import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireProfile={false}>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
