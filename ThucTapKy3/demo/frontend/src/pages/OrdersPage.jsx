import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../services/orderService";
import OrderStatusBadge from "../components/OrderStatusBadge";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function OrdersPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>;
  }

  if (!orders) return <p className="text-sm text-gray-500">Đang tải...</p>;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <div className="bg-white border rounded p-6 text-sm text-gray-500">
          Bạn chưa có đơn hàng nào.{" "}
          <Link to="/products" className="text-blue-700 hover:underline">
            Bắt đầu mua sắm
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded divide-y">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-sm">Đơn hàng #{order.id}</p>
                <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-blue-900 text-sm">{currency.format(order.totalAmount)}</span>
                <OrderStatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
