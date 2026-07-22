import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import ConfirmDialog from "./ConfirmDialog";

const navLinkClass = ({ isActive }) =>
  `hover:text-blue-200 ${isActive ? "text-white font-semibold" : "text-blue-100"}`;

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount: cartCount } = useCart();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-lg font-bold tracking-wide">
              Sales Management
            </Link>
            <nav className="hidden sm:flex items-center gap-6 text-sm">
              <NavLink to="/" end className={navLinkClass}>
                Trang chủ
              </NavLink>
              <NavLink to="/products" className={navLinkClass}>
                Sản phẩm
              </NavLink>
              <NavLink to="/orders" className={navLinkClass}>
                Đơn hàng của tôi
              </NavLink>
              <NavLink to="/account" className={navLinkClass}>
                Tài khoản
              </NavLink>
              {(user?.role === "ADMIN" || user?.role === "STAFF") && (
                <NavLink to="/admin" className={navLinkClass}>
                  Trang quản trị
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative text-sm text-blue-100 hover:text-white">
              🛒 Giỏ hàng
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-blue-100">{user?.fullName}</span>
                <button
                  onClick={() => setConfirmingLogout(true)}
                  className="bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Link to="/login" className="bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded">
                  Đăng nhập
                </Link>
                <Link to="/register" className="hover:text-blue-200 px-2">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-gray-100 text-center text-sm text-gray-500 py-4">
        Sales Management System — bài tập lớn (course project)
      </footer>

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
