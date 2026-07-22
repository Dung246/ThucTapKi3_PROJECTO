import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrder } from "../../services/orderService";
import { updateOrderStatus } from "../../services/adminService";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import { ALLOWED_STATUS_TRANSITIONS, PAYMENT_METHOD_LABELS, orderStatusLabel } from "../../utils/orderStatus";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const ACTIONABLE_STATUSES = ["CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  // The backend rejects SHIPPING -> CANCELLED without a note (MissingCancellationNoteException);
  // ask for one client-side instead of letting Admin submit and hit a 400.
  const [cancelNoteTarget, setCancelNoteTarget] = useState(null);
  const [note, setNote] = useState("");

  function load() {
    setLoading(true);
    getOrder(id)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function transition(status, noteValue) {
    setUpdating(true);
    setError("");
    try {
      await updateOrderStatus(id, { status, note: noteValue });
      setCancelNoteTarget(null);
      setNote("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  function handleClick(status) {
    if (status === "CANCELLED" && order.status === "SHIPPING") {
      setCancelNoteTarget(status);
      return;
    }
    transition(status, null);
  }

  if (loading) return <p className="text-sm text-gray-500">Đang tải...</p>;
  if (error && !order) {
    return <div className="rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>;
  }

  const allowedNext = ALLOWED_STATUS_TRANSITIONS[order.status] || [];

  return (
    <div>
      <Link to="/admin/orders" className="text-blue-700 text-sm hover:underline">
        ← Quay lại danh sách đơn hàng
      </Link>

      <div className="flex items-center justify-between mt-4">
        <h1 className="text-lg font-semibold">Đơn hàng #{order.id}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Khách hàng: {order.customerName} — {new Date(order.createdAt).toLocaleString("vi-VN")}
      </p>

      {error && <div className="mt-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

      <div className="bg-white border rounded p-4 mt-4">
        <h2 className="font-semibold text-sm mb-2">Cập nhật trạng thái</h2>
        <div className="flex gap-2 flex-wrap">
          {ACTIONABLE_STATUSES.map((s) => {
            const allowed = allowedNext.includes(s);
            return (
              <button
                key={s}
                disabled={!allowed || updating}
                onClick={() => handleClick(s)}
                className={`text-sm px-3 py-1.5 rounded border ${
                  allowed
                    ? "bg-blue-900 text-white border-blue-900 hover:bg-blue-800"
                    : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
              >
                Chuyển sang: {orderStatusLabel(s)}
              </button>
            );
          })}
          {allowedNext.length === 0 && <p className="text-sm text-gray-500">Đơn hàng đã ở trạng thái cuối cùng.</p>}
        </div>

        {cancelNoteTarget && (
          <div className="mt-3 border-t pt-3">
            <label className="block text-xs text-gray-500 mb-1">Lý do hủy (bắt buộc khi hủy đơn đang giao)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
            <div className="flex gap-2 mt-2">
              <button
                disabled={!note.trim() || updating}
                onClick={() => transition("CANCELLED", note)}
                className="bg-red-600 text-white text-sm px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Xác nhận hủy
              </button>
              <button
                onClick={() => {
                  setCancelNoteTarget(null);
                  setNote("");
                }}
                className="text-sm px-3 py-1.5 rounded border"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="md:col-span-2 bg-white border rounded p-4">
          <h2 className="font-semibold text-sm mb-3">Sản phẩm</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Sản phẩm</th>
                <th className="pb-2 text-center">SL</th>
                <th className="pb-2 text-right">Đơn giá</th>
                <th className="pb-2 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId} className="border-b last:border-0">
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">{currency.format(item.unitPrice)}</td>
                  <td className="py-2 text-right font-medium">{currency.format(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {order.statusHistory.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-sm mb-2">Lịch sử trạng thái</h2>
              <ul className="text-xs text-gray-600 space-y-1">
                {order.statusHistory.map((h, idx) => (
                  <li key={idx}>
                    {new Date(h.changedAt).toLocaleString("vi-VN")} —{" "}
                    {h.oldStatus ? `${orderStatusLabel(h.oldStatus)} → ` : ""}
                    {orderStatusLabel(h.newStatus)} ({h.changedByName})
                    {h.note && <span className="italic"> — {h.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white border rounded p-4 h-fit">
          <h2 className="font-semibold text-sm mb-3">Thông tin giao hàng</h2>
          <p className="text-sm text-gray-600 mb-2">{order.shippingAddress}</p>
          <p className="text-sm text-gray-600 mb-4">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          <div className="flex justify-between text-sm font-bold text-blue-900 border-t pt-2">
            <span>Tổng cộng</span>
            <span>{currency.format(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
