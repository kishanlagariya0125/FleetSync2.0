import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import ProtectedRoute from "./components/RoleRoute";
import RoleRoute from "./components/RoleRoute";

import DashboardLayout from "./layouts/DashboardLayout";

import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterOwner from "./pages/RegisterOwner";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import FuelLogs from "./pages/FuelLogs";
import Analytics from "./pages/Analytics";
import Team from "./pages/Team";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>

              {/* ── PUBLIC ─────────────────────────────────────── */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Homepage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-owner" element={<RegisterOwner />} />

              {/* ── PROTECTED WORKSPACE ────────────────────────── */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard — all roles */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Team — OWNER + MANAGER */}
                <Route
                  path="/team"
                  element={
                    <RoleRoute roles={["OWNER", "MANAGER"]}>
                      <Team />
                    </RoleRoute>
                  }
                />

                {/* Vehicles — OWNER + MANAGER + DISPATCHER + FINANCE */}
                <Route
                  path="/vehicles"
                  element={
                    <RoleRoute roles={["OWNER", "MANAGER", "DISPATCHER", "FINANCE"]}>
                      <Vehicles />
                    </RoleRoute>
                  }
                />

                {/* Drivers — OWNER + MANAGER + DISPATCHER */}
                <Route
                  path="/drivers"
                  element={
                    <RoleRoute roles={["OWNER", "MANAGER", "DISPATCHER"]}>
                      <Drivers />
                    </RoleRoute>
                  }
                />

                {/* Trips — OWNER + MANAGER + DISPATCHER + DRIVER */}
                <Route
                  path="/trips"
                  element={
                    <RoleRoute roles={["OWNER", "MANAGER", "DISPATCHER", "DRIVER"]}>
                      <Trips />
                    </RoleRoute>
                  }
                />

                {/* Maintenance — OWNER + MANAGER + DISPATCHER + FINANCE */}
                <Route
                  path="/maintenance"
                  element={
                    <RoleRoute roles={["OWNER", "MANAGER", "DISPATCHER", "FINANCE"]}>
                      <Maintenance />
                    </RoleRoute>
                  }
                />

                {/* Fuel Logs — OWNER + MANAGER + FINANCE */}
                <Route
                  path="/fuel"
                  element={
                    <RoleRoute roles={["OWNER", "MANAGER", "FINANCE"]}>
                      <FuelLogs />
                    </RoleRoute>
                  }
                />

                {/* Analytics — OWNER + MANAGER + DISPATCHER + FINANCE */}
                <Route
                  path="/analytics"
                  element={
                    <RoleRoute roles={["OWNER", "MANAGER", "DISPATCHER", "FINANCE"]}>
                      <Analytics />
                    </RoleRoute>
                  }
                />
              </Route>

              {/* ── CATCH-ALL ──────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/home" replace />} />

            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}