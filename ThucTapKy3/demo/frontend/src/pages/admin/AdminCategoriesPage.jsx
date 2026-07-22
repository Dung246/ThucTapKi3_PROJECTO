import { useEffect, useState } from "react";
import { getCategories } from "../../services/productService";
import { createCategory, updateCategory, deleteCategory } from "../../services/adminService";
import ConfirmDialog from "../../components/ConfirmDialog";

const emptyForm = { name: "", description: "" };

// Mirrors CategoryRequest's @NotBlank name (used identically by both POST and PUT).
function validate(form) {
  if (!form.name.trim()) return "Vui lòng nhập tên danh mục.";
  return "";
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  // Shared by create + edit since both reuse the same `form` state and are never open at once
  // in normal use; reset whenever either flow (re)starts so a stale message doesn't carry over.
  const [attempted, setAttempted] = useState(false);
  const validationError = attempted ? validate(form) : "";
  const [pendingDelete, setPendingDelete] = useState(null);

  function load() {
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  function startEdit(category) {
    setEditingId(category.id);
    setForm({ name: category.name, description: category.description || "" });
    setAttempted(false);
  }

  async function saveEdit(id) {
    setAttempted(true);
    if (validate(form)) return;
    setError("");
    try {
      await updateCategory(id, form);
      setEditingId(null);
      setAttempted(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setAttempted(true);
    if (validate(form)) return;
    setError("");
    try {
      await createCategory(form);
      setForm(emptyForm);
      setCreating(false);
      setAttempted(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDelete(category) {
    setPendingDelete(category);
  }

  async function confirmDelete() {
    const category = pendingDelete;
    setPendingDelete(null);
    setError("");
    try {
      await deleteCategory(category.id);
      load();
    } catch (err) {
      // Backend still guards this with a 409 if products reference the category (see KEY
      // DECISIONS) - the confirmation popup doesn't replace that check, it just runs before it.
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Danh mục</h1>
        <button
          onClick={() => {
            setCreating((v) => !v);
            setForm(emptyForm);
            setAttempted(false);
          }}
          className="bg-blue-900 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-800"
        >
          + Thêm danh mục mới
        </button>
      </div>

      {(validationError || error) && (
        <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {validationError || error}
        </div>
      )}

      {creating && (
        <form onSubmit={handleCreate} className="bg-white border rounded p-3 mb-4 flex gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên danh mục</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mô tả</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!!validationError}
            className="bg-blue-900 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-800 disabled:opacity-50"
          >
            Tạo
          </button>
        </form>
      )}

      {!categories ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <div className="bg-white border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Tên danh mục</th>
                <th className="px-3 py-2">Mô tả</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) =>
                editingId === c.id ? (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{c.id}</td>
                    <td className="px-3 py-2">
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => saveEdit(c.id)} className="text-blue-700 hover:underline mr-3 disabled:opacity-50 disabled:no-underline" disabled={attempted && !!validationError}>
                        Lưu
                      </button>
                      <button onClick={() => { setEditingId(null); setAttempted(false); }} className="text-gray-500 hover:underline">
                        Hủy
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{c.id}</td>
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2 text-gray-600">{c.description}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => startEdit(c)} className="text-blue-700 hover:underline mr-3">
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(c)} className="text-red-600 hover:underline">
                        Xóa
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Xóa danh mục"
        message={`Bạn có chắc chắn muốn xóa danh mục "${pendingDelete?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
