import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const cards = [
    { to: "/admin/orders", label: "Đơn hàng", desc: "Xem và cập nhật trạng thái đơn hàng", show: true },
    { to: "/admin/products", label: "Sản phẩm", desc: "Quản lý danh sách sản phẩm", show: isAdmin },
    { to: "/admin/categories", label: "Danh mục", desc: "Quản lý danh mục sản phẩm", show: isAdmin },
    { to: "/admin/customers", label: "Khách hàng", desc: "Khóa/mở khóa tài khoản khách hàng", show: isAdmin },
    { to: "/admin/staff", label: "Tài khoản", desc: "Quản lý tài khoản nhân viên/quản trị", show: isAdmin },
    { to: "/admin/statistics", label: "Thống kê", desc: "Doanh thu và sản phẩm bán chạy", show: isAdmin },
  ].filter((c) => c.show);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-1">Xin chào, {user?.fullName}</h1>
      <p className="text-sm text-gray-500 mb-6">Chào mừng đến trang quản trị Sales Management System.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="bg-white border rounded p-4 hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-blue-900">{c.label}</h2>
            <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
