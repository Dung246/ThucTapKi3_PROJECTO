import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "./ConfirmDialog";

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded text-sm ${isActive ? "bg-blue-800 text-white font-semibold" : "text-blue-100 hover:bg-blue-800/60"}`;

// Layout matches Ban_hang_SRS.docx Hinh 3.5 / 3.7 wireframes: navy sidebar with a fixed MENU list,
// white content area. Admin-only sidebar items are hidden for STAFF (backend also rejects them via
// the blanket /api/admin/** ADMIN-only rule) so Staff only ever sees Dashboard + Đơn hàng.
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-blue-950 text-white flex-shrink-0 flex flex-col">
        <div className="px-4 py-4 border-b border-blue-800">
          <Link to="/" className="text-sm font-bold tracking-wide">
            Sales Management
          </Link>
          <p className="text-xs text-blue-300 mt-1">Trang quản trị</p>
        </div>
        <nav className="flex-1 py-3 space-y-1 px-2">
          <NavLink to="/admin" end className={linkClass}>
            Dashboard
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin/products" className={linkClass}>
              Sản phẩm
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/categories" className={linkClass}>
              Danh mục
            </NavLink>
          )}
          <NavLink to="/admin/orders" className={linkClass}>
            Đơn hàng
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin/customers" className={linkClass}>
              Khách hàng
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/staff" className={linkClass}>
              Tài khoản
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/statistics" className={linkClass}>
              Thống kê
            </NavLink>
          )}
        </nav>
        <div className="px-4 py-3 border-t border-blue-800 text-sm">
          <p className="text-blue-200 mb-2">{user?.fullName}</p>
          <button onClick={() => setConfirmingLogout(true)} className="text-blue-300 hover:text-white text-xs">
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-x-auto">
        <Outlet />
      </main>

      <ConfirmDialog
        open={confirmingLogout}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất?"
        confirmLabel="Đăng xuất"
        onConfirm={() => {
          setConfirmingLogout(false);
          logout();
        }}
        onCancel={() => setConfirmingLogout(false)}
      />
    </div>
  );
}
