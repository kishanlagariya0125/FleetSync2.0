import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RoleRoute({ roles = [], children }) {
  const { user, loading } = useAuth();

  // wait auth load
  if (loading) return null;

  // not logged in
  if (!user) return <Navigate to="/home" replace />;


  // inactive account (backend is_active)
  if (user.is_active === false)
    return <Navigate to="/home" replace />;


  // no role restriction
  if (!roles.length) return children;

  // role check (FleetFlow roles)
  const allowed = roles.includes(user.role);

  if (!allowed)
    return <Navigate to="/dashboard" replace />;


  return children;
}