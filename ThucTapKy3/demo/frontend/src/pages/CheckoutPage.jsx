import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart } from "../services/cartService";
import { createOrder } from "../services/orderService";
import { useCart } from "../context/CartContext";
import { PAYMENT_METHOD_LABELS } from "../utils/orderStatus";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

// Mirrors OrderRequest's @NotBlank shippingAddress (paymentMethod is always a valid enum value
// here since the radio group always has one selected, defaulting to COD).
function validate(shippingAddress) {
  if (!shippingAddress.trim()) return "Vui lòng nhập địa chỉ giao hàng.";
  return "";
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [error, setError] = useState("");
  const [unavailableProducts, setUnavailableProducts] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const validationError = attempted ? validate(shippingAddress) : "";

  useEffect(() => {
    getCart()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setAttempted(true);
    if (validate(shippingAddress)) return;
    setError("");
    setUnavailableProducts(null);
    setSubmitting(true);
    try {
      const order = await createOrder({ shippingAddress, paymentMethod });
      refreshCart();
      navigate(`/orders/${order.id}`, { state: { justPlaced: true } });
    } catch (err) {
      // OrderItemsUnavailableException's message already names the products, e.g.
      // "The following products are unavailable or out of stock: X, Y" - surface it as-is
      // and offer a direct way back to the cart to fix it, per today's requirement 2.
      if (err.message.startsWith("The following products are unavailable")) {
        setUnavailableProducts(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Đang tải...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-white border rounded p-6 text-sm text-gray-500">
        Giỏ hàng của bạn đang trống, không thể đặt hàng.{" "}
        <Link to="/products" className="text-blue-700 hover:underline">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Đặt hàng &amp; Thanh toán</h1>

      {unavailableProducts && (
        <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-3">
          <p>{unavailableProducts}</p>
          <Link to="/cart" className="underline font-medium">
            Quay lại giỏ hàng để chỉnh sửa
          </Link>
        </div>
      )}
      {(validationError || error) && (
        <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {validationError || error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="md:col-span-2 bg-white border rounded p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ giao hàng</label>
            <textarea
              rows={3}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phương thức thanh toán</label>
            <div className="space-y-2">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm border rounded px-3 py-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !!validationError}
            className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800 disabled:opacity-50"
          >
            {submitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
          </button>
        </form>

        <div className="bg-white border rounded p-4 h-fit">
          <h2 className="font-semibold text-sm mb-3">Đơn hàng của bạn</h2>
          <ul className="space-y-2 text-sm mb-3">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span className="text-gray-600">
                  {item.productName} × {item.quantity}
                </span>
                <span>{currency.format(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm font-bold text-blue-900 border-t pt-2">
            <span>Tổng cộng</span>
            <span>{currency.format(cart.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
