import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct } from "../services/productService";
import { getProductReviews } from "../services/reviewService";
import { addToCart } from "../services/cartService";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Stars from "../components/Stars";
import { resolveImageUrl } from "../services/api";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function ProductDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { refreshCart } = useCart();
  const canAddToCart = isAuthenticated && user?.role === "CUSTOMER";

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([getProduct(id), getProductReviews(id)])
      .then(([productData, reviewData]) => {
        setProduct(productData);
        setReviews(reviewData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddToCart() {
    setAdding(true);
    setToast("");
    try {
      await addToCart(product.id, 1);
      setToast("Đã thêm vào giỏ hàng");
      refreshCart();
    } catch (err) {
      setToast(err.message);
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Đang tải...</p>;

  if (error) {
    return (
      <div>
        <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error === "Product not found with id " + id ? "Sản phẩm không còn tồn tại" : error}
        </div>
        <Link to="/products" className="text-blue-700 text-sm hover:underline">
          ← Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/products" className="text-blue-700 text-sm hover:underline">
        ← Quay lại danh sách sản phẩm
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        <div className="bg-gray-100 rounded h-80 flex items-center justify-center">
          {product.imageUrl ? (
            <img src={resolveImageUrl(product.imageUrl)} alt={product.name} className="h-full w-full object-cover rounded" />
          ) : (
            <span className="text-gray-400">[Ảnh]</span>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{product.categoryName}</p>

          {reviews && reviews.reviewCount > 0 && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Stars value={reviews.averageRating} />
              <span className="text-gray-500">
                {reviews.averageRating.toFixed(1)} ({reviews.reviewCount} đánh giá)
              </span>
            </div>
          )}

          <p className="text-2xl text-blue-900 font-bold mt-4">{currency.format(product.price)}</p>
          <p className="text-sm text-gray-500 mt-1">Tồn kho: {product.quantity}</p>
          <p className="mt-4 text-gray-700 whitespace-pre-line">{product.description}</p>

          {toast && (
            <div className="mt-4 rounded bg-blue-50 border border-blue-200 text-blue-800 text-sm px-3 py-2">
              {toast}
            </div>
          )}

          {canAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={adding || product.quantity <= 0}
              className="mt-4 bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
            >
              {product.quantity <= 0 ? "Hết hàng" : adding ? "Đang thêm..." : "Thêm vào giỏ"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Đánh giá sản phẩm</h2>
        {!reviews || reviews.reviews.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.reviews.map((r) => (
              <li key={r.id} className="border-b pb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{r.customerName}</span>
                  <Stars value={r.rating} />
                  <span className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-700 mt-1">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
