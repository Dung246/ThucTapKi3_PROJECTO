import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminProducts, deleteProduct } from "../../services/adminService";
import { getCategories } from "../../services/productService";
import ConfirmDialog from "../../components/ConfirmDialog";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function AdminProductsPage() {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ name: "", categoryId: "", status: "" });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(0);
  const [productPage, setProductPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  function load() {
    setLoading(true);
    setError("");
    listAdminProducts({ ...applied, page, size: 20 })
      .then(setProductPage)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [applied, page]);

  function applyFilters(e) {
    e.preventDefault();
    setPage(0);
    setApplied(filters);
  }

  function handleDelete(product) {
    setPendingDelete(product);
  }

  async function confirmDelete() {
    const product = pendingDelete;
    setPendingDelete(null);
    setMessage("");
    try {
      await deleteProduct(product.id);
      setMessage(`Đã ngừng kinh doanh "${product.name}"`);
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Sản phẩm</h1>
        <Link to="/admin/products/new" className="bg-blue-900 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-800">
          + Thêm sản phẩm mới
        </Link>
      </div>

      <form onSubmit={applyFilters} className="bg-white border rounded p-3 mb-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tên sản phẩm</label>
          <input
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Danh mục</label>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="border rounded px-2 py-1.5 text-sm"
          >
            <option value="">Tất cả</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Trạng thái</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border rounded px-2 py-1.5 text-sm"
          >
            <option value="">Tất cả</option>
            <option value="ACTIVE">Đang kinh doanh</option>
            <option value="INACTIVE">Ngừng kinh doanh</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-900 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-800">
          Áp dụng
        </button>
      </form>

      {message && <div className="mb-3 rounded bg-blue-50 border border-blue-200 text-blue-800 text-sm px-3 py-2">{message}</div>}
      {error && <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <div className="bg-white border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Tên SP</th>
                <th className="px-3 py-2">Danh mục</th>
                <th className="px-3 py-2 text-right">Giá</th>
                <th className="px-3 py-2 text-right">Tồn kho</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {productPage?.content.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{p.id}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.categoryName}</td>
                  <td className="px-3 py-2 text-right">{currency.format(p.price)}</td>
                  <td className="px-3 py-2 text-right">{p.quantity}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {p.status === "ACTIVE" ? "Đang kinh doanh" : "Ngừng kinh doanh"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/admin/products/${p.id}/edit`} state={{ product: p }} className="text-blue-700 hover:underline mr-3">
                      Sửa
                    </Link>
                    {p.status === "ACTIVE" && (
                      <button onClick={() => handleDelete(p)} className="text-red-600 hover:underline">
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {productPage?.content.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                    Không có sản phẩm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {productPage && productPage.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
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

      <ConfirmDialog
        open={!!pendingDelete}
        title="Ẩn sản phẩm"
        message={`Bạn có chắc chắn muốn ẩn sản phẩm "${pendingDelete?.name}"? Sản phẩm sẽ không còn hiển thị cho khách hàng.`}
        confirmLabel="Ẩn sản phẩm"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
