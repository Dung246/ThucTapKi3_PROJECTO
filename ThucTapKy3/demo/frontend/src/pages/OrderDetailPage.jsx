import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { getOrder } from "../services/orderService";
import { getProductReviews } from "../services/reviewService";
import { useAuth } from "../context/AuthContext";
import OrderStatusBadge from "../components/OrderStatusBadge";
import ReviewForm from "../components/ReviewForm";
import Stars from "../components/Stars";
import { PAYMENT_METHOD_LABELS, orderStatusLabel } from "../utils/orderStatus";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const justPlaced = location.state?.justPlaced;

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  // productId -> this customer's existing review for it (undefined = not checked yet, null = none)
  const [myReviews, setMyReviews] = useState({});

  useEffect(() => {
    setLoading(true);
    getOrder(id)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Only a COMPLETED order can be reviewed (UC-08). Pre-fetch each line item's existing reviews so
  // the form is hidden entirely for products the customer already reviewed, instead of letting them
  // submit and hit the backend's 409 (per today's requirement 4).
  useEffect(() => {
    if (!order || order.status !== "COMPLETED") return;
    const productIds = [...new Set(order.items.map((i) => i.productId))];
    productIds.forEach((productId) => {
      getProductReviews(productId)
        .then((data) => {
          const mine = data.reviews.find((r) => r.userId === user.id) || null;
          setMyReviews((prev) => ({ ...prev, [productId]: mine }));
        })
        .catch(() => setMyReviews((prev) => ({ ...prev, [productId]: null })));
    });
  }, [order, user]);

  if (loading) return <p className="text-sm text-gray-500">Đang tải...</p>;

  if (error) {
    return (
      <div>
        <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>
        <Link to="/orders" className="text-blue-700 text-sm hover:underline">
          ← Quay lại đơn hàng của tôi
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/orders" className="text-blue-700 text-sm hover:underline">
        ← Quay lại đơn hàng của tôi
      </Link>

      {justPlaced && (
        <div className="mt-4 rounded bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2">
          Đặt hàng thành công! Mã đơn hàng #{order.id}, trạng thái hiện tại: {orderStatusLabel(order.status)}.
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <h1 className="text-lg font-semibold">Đơn hàng #{order.id}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>

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
                <tr key={item.productId} className="border-b last:border-0 align-top">
                  <td className="py-2">
                    <Link to={`/products/${item.productId}`} className="hover:text-blue-800">
                      {item.productName}
                    </Link>

                    {order.status === "COMPLETED" && (
                      <div>
                        {myReviews[item.productId] === undefined ? null : myReviews[item.productId] ? (
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">Đánh giá của bạn: </span>
                            <Stars value={myReviews[item.productId].rating} />
                            {myReviews[item.productId].comment && (
                              <p className="mt-1">{myReviews[item.productId].comment}</p>
                            )}
                          </div>
                        ) : (
                          <ReviewForm
                            productId={item.productId}
                            onSubmitted={(review) =>
                              setMyReviews((prev) => ({ ...prev, [item.productId]: review }))
                            }
                          />
                        )}
                      </div>
                    )}
                  </td>
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
