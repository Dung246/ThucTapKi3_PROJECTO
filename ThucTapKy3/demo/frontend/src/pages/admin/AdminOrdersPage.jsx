import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAllOrders } from "../../services/adminService";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import { ORDER_STATUS_FILTERS, orderStatusLabel } from "../../utils/orderStatus";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  function load() {
    listAllOrders(status || undefined)
      .then(setOrders)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [status]);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Quản lý đơn hàng</h1>

      <div className="bg-white border rounded p-3 mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 mr-1">Lọc:</span>
        <button
          onClick={() => setStatus("")}
          className={`text-xs px-2.5 py-1 rounded border ${status === "" ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-700"}`}
        >
          Tất cả
        </button>
        {ORDER_STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs px-2.5 py-1 rounded border ${status === s ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-700"}`}
          >
            {orderStatusLabel(s)}
          </button>
        ))}
      </div>

      {error && <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

      {!orders ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <div className="bg-white border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-3 py-2">Mã ĐH</th>
                <th className="px-3 py-2">Khách hàng</th>
                <th className="px-3 py-2">Ngày đặt</th>
                <th className="px-3 py-2 text-right">Tổng tiền</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="px-3 py-2">#{o.id}</td>
                  <td className="px-3 py-2">{o.customerName}</td>
                  <td className="px-3 py-2">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-3 py-2 text-right">{currency.format(o.totalAmount)}</td>
                  <td className="px-3 py-2">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/admin/orders/${o.id}`} className="text-blue-700 hover:underline">
                      Xem / Cập nhật
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    Không có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
