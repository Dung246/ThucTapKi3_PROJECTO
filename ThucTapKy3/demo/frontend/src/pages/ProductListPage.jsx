import { useEffect, useState } from "react";
import { searchProducts, getCategories } from "../services/productService";
import { addToCart } from "../services/cartService";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";

export default function ProductListPage() {
  const { isAuthenticated, user } = useAuth();
  const { refreshCart } = useCart();
  const canAddToCart = isAuthenticated && user?.role === "CUSTOMER";

  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ name: "", categoryId: "", minPrice: "", maxPrice: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(0);
  const [productPage, setProductPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    searchProducts({ ...appliedFilters, page, size: 12 })
      .then(setProductPage)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [appliedFilters, page]);

  function handleFilterChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function applyFilters(e) {
    e.preventDefault();
    setPage(0);
    setAppliedFilters(filters);
  }

  async function handleAddToCart(product) {
    setAddingId(product.id);
    setToast("");
    try {
      await addToCart(product.id, 1);
      setToast(`Đã thêm "${product.name}" vào giỏ hàng`);
      refreshCart();
    } catch (err) {
      setToast(err.message);
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <aside className="md:col-span-1">
        <form onSubmit={applyFilters} className="bg-white border rounded p-4 space-y-3">
          <h2 className="font-semibold text-sm">Bộ lọc</h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tìm kiếm</label>
            <input
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Tên sản phẩm..."
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Danh mục</label>
            <select
              name="categoryId"
              value={filters.categoryId}
              onChange={handleFilterChange}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Tất cả</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Giá từ</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Đến</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-900 text-white text-sm py-1.5 rounded hover:bg-blue-800">
            Áp dụng
          </button>
        </form>
      </aside>

      <section className="md:col-span-3">
        <h1 className="text-lg font-semibold mb-3">Danh sách sản phẩm</h1>

        {toast && (
          <div className="mb-3 rounded bg-blue-50 border border-blue-200 text-blue-800 text-sm px-3 py-2">
            {toast}
          </div>
        )}
        {error && (
          <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Đang tải...</p>
        ) : productPage && productPage.content.length === 0 ? (
          <p className="text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {productPage?.content.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                canAddToCart={canAddToCart}
                onAddToCart={handleAddToCart}
                adding={addingId === product.id}
              />
            ))}
          </div>
        )}

        {productPage && productPage.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={productPage.first}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Trước
            </button>
            <span>
              Trang {productPage.number + 1} / {productPage.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={productPage.last}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
