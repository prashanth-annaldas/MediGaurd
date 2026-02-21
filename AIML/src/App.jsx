import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Protect Dashboard route
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>

        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to={token ? "/dashboard" : "/register"} />}
        />

        {/* Signup */}
        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" /> : <Signup />}
        />

        {/* Login */}
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" /> : <Login />}
        />

        {/* Dashboard (Protected) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}