import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart, updateCartItem, removeCartItem } from "../services/cartService";
import { useCart } from "../context/CartContext";
import ConfirmDialog from "../components/ConfirmDialog";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function CartPage() {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyItemId, setBusyItemId] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);

  function loadCart() {
    setLoading(true);
    return getCart()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function handleQuantityChange(item, nextQuantity) {
    if (nextQuantity < 1) return;
    setBusyItemId(item.id);
    setNotice("");
    setError("");
    try {
      const updated = await updateCartItem(item.id, nextQuantity);
      // The backend caps at available stock instead of rejecting (Day 3 decision) - if it capped
      // below what we asked for, that's worth telling the customer rather than silently applying it.
      if (updated.quantity < nextQuantity) {
        setNotice(`"${updated.productName}" chỉ còn ${updated.quantity} sản phẩm trong kho, đã điều chỉnh số lượng.`);
      }
      await loadCart();
      refreshCart();
    } catch (err) {
      // 409 ProductOutOfStockException lands here when stock has dropped to 0.
      setError(err.message);
    } finally {
      setBusyItemId(null);
    }
  }

  function handleRemove(item) {
    setPendingRemove(item);
  }

  async function confirmRemove() {
    const item = pendingRemove;
    setPendingRemove(null);
    setBusyItemId(item.id);
    setError("");
    setNotice("");
    try {
      await removeCartItem(item.id);
      await loadCart();
      refreshCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyItemId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Đang tải...</p>;

  if (error && !cart) {
    return <div className="rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>;
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Giỏ hàng</h1>

      {notice && (
        <div className="mb-4 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-3 py-2">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>
      )}

      {isEmpty ? (
        <div className="bg-white border rounded p-6 text-sm text-gray-500">
          Giỏ hàng của bạn đang trống.{" "}
          <Link to="/products" className="text-blue-700 hover:underline">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white border rounded p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 shrink-0">
                  [Ảnh]
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.productId}`} className="font-medium text-sm hover:text-blue-800">
                    {item.productName}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">Đơn giá: {currency.format(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    disabled={busyItemId === item.id || item.quantity <= 1}
                    className="w-7 h-7 border rounded disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    disabled={busyItemId === item.id}
                    className="w-7 h-7 border rounded disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <div className="w-28 text-right font-semibold text-blue-900 text-sm">
                  {currency.format(item.lineTotal)}
                </div>
                <button
                  onClick={() => handleRemove(item)}
                  disabled={busyItemId === item.id}
                  className="text-xs text-red-600 hover:underline disabled:opacity-40"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white border rounded p-4 h-fit">
            <h2 className="font-semibold text-sm mb-3">Thông tin đơn hàng</h2>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-500">Tổng cộng</span>
              <span className="font-bold text-blue-900">{currency.format(cart.totalAmount)}</span>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800"
            >
              Tiến hành đặt hàng
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingRemove}
        title="Xóa sản phẩm khỏi giỏ hàng"
        message={`Bạn có chắc chắn muốn xóa "${pendingRemove?.productName}" khỏi giỏ hàng?`}
        confirmLabel="Xóa"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
