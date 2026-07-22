import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { createProduct, updateProduct, listAdminProducts, uploadProductImage } from "../../services/adminService";
import { getCategories } from "../../services/productService";
import { resolveImageUrl } from "../../services/api";

const emptyForm = { name: "", categoryId: "", price: "", quantity: "", imageUrl: "", description: "" };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Mirrors ProductRequest's Bean Validation (@NotBlank name, @NotNull categoryId,
// @DecimalMin("0.0") price, @PositiveOrZero quantity). Also guards against non-numeric garbage in
// price/quantity, which native type="number" used to block by itself but a plain string field no
// longer does.
function validate(form) {
  if (!form.name.trim()) return "Vui lòng nhập tên sản phẩm.";
  if (!form.categoryId) return "Vui lòng chọn danh mục.";
  if (form.price === "" || Number.isNaN(Number(form.price))) return "Vui lòng nhập giá hợp lệ.";
  if (Number(form.price) < 0) return "Giá không được âm.";
  if (form.quantity === "" || Number.isNaN(Number(form.quantity))) return "Vui lòng nhập số lượng tồn kho hợp lệ.";
  if (Number(form.quantity) < 0) return "Số lượng tồn kho không được âm.";
  return "";
}

// Mirrors ProductService.uploadImage()'s own checks (content-type startsWith "image/", <= 5MB) so
// an obviously-invalid file is rejected before a round trip to the backend, not instead of it.
function validateImageFile(file) {
  if (!file) return "";
  if (!file.type.startsWith("image/")) return "Tệp phải là hình ảnh (jpg, png, gif, webp...).";
  if (file.size > MAX_IMAGE_BYTES) return "Kích thước ảnh không được vượt quá 5MB.";
  return "";
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const validationError = attempted ? validate(form) || validateImageFile(imageFile) : "";

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Revoke the previous object URL whenever it's replaced/cleared, so selecting a few images in a
  // row (or navigating away) doesn't leak blob URLs for the lifetime of the tab.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleFileChange(e) {
    const file = e.target.files[0] || null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  }

  function fillForm(product) {
    setForm({
      name: product.name,
      categoryId: String(product.categoryId),
      price: String(product.price),
      quantity: String(product.quantity),
      imageUrl: product.imageUrl || "",
      description: product.description || "",
    });
  }

  useEffect(() => {
    if (!isEdit) return;
    // Preferred path: product came from the list page's row click (no extra request).
    if (location.state?.product) {
      fillForm(location.state.product);
      setLoading(false);
      return;
    }
    // Fallback for a direct URL/refresh: scan the admin product listing for this id.
    listAdminProducts({ size: 200 })
      .then((data) => {
        const found = data.content.find((p) => String(p.id) === id);
        if (!found) throw new Error("Không tìm thấy sản phẩm");
        fillForm(found);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    setAttempted(true);
    if (validate(form) || validateImageFile(imageFile)) return;
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      quantity: Number(form.quantity),
      imageUrl: form.imageUrl || null,
      description: form.description || null,
    };
    try {
      // Create/update always goes through the plain JSON endpoint first - a new product has no id
      // yet, so the per-product image upload endpoint (POST /api/admin/products/{id}/image) can
      // only ever run as a second step once an id exists (see KEY DECISIONS for why this two-call
      // sequence was chosen over e.g. accepting multipart directly on POST /api/products).
      let productId = id;
      if (isEdit) {
        await updateProduct(id, payload);
      } else {
        const created = await createProduct(payload);
        productId = created.id;
      }
      if (imageFile) {
        await uploadProductImage(productId, imageFile);
      }
      navigate("/admin/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Đang tải...</p>;

  return (
    <div className="max-w-xl">
      <Link to="/admin/products" className="text-blue-700 text-sm hover:underline">
        ← Quay lại danh sách sản phẩm
      </Link>
      <h1 className="text-lg font-semibold mt-3 mb-4">{isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h1>

      {(validationError || error) && (
        <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {validationError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border rounded p-4 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tên sản phẩm</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Danh mục</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full border rounded px-2 py-1.5 text-sm"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Giá (VNĐ)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Tồn kho</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ảnh sản phẩm</label>
          {(imagePreview || form.imageUrl) && (
            <img
              src={imagePreview || resolveImageUrl(form.imageUrl)}
              alt="Xem trước"
              className="h-32 w-32 object-cover rounded border mb-2"
            />
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
          <p className="text-xs text-gray-500 mt-1">Tối đa 5MB (jpg, png, gif, webp...).</p>
          <label className="block text-xs text-gray-500 mt-2 mb-1">Hoặc nhập URL ảnh trực tiếp (dùng cho dữ liệu mẫu)</label>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://..."
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Mô tả</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !!validationError}
          className="bg-blue-900 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </form>
    </div>
  );
}
