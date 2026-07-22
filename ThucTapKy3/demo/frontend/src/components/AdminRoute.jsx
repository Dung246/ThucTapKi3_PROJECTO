import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Frontend-side gate on top of backend RBAC (SecurityConfig): hides Admin Dashboard routes from
// non-ADMIN/STAFF users entirely instead of letting the page render and fail on the first API call.
export default function AdminRoute({ roles = ["ADMIN", "STAFF"] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(user?.role)) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <h1 className="text-xl font-semibold text-red-700 mb-2">403 — Không có quyền truy cập</h1>
        <p className="text-sm text-gray-600">Bạn không có quyền truy cập trang quản trị này.</p>
      </div>
    );
  }
  return <Outlet />;
}
