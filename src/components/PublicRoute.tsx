import { Navigate, Outlet } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? <Navigate to="/" replace /> : <Outlet />;
}
