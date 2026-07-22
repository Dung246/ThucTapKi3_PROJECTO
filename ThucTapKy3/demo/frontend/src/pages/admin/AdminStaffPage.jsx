import { useEffect, useState } from "react";
import { listStaff, createStaffAccount, updateStaffAccount } from "../../services/adminService";
import { isValidEmail, PASSWORD_MIN_LENGTH } from "../../utils/validation";

const emptyForm = { fullName: "", email: "", password: "", phone: "", role: "STAFF" };
const emptyEditForm = { fullName: "", email: "", phone: "", role: "STAFF" };

// Mirrors CreateStaffRequest's Bean Validation (@NotBlank fullName/email/password, @Email, @Size(min=8)).
function validateCreate(form) {
  if (!form.fullName.trim()) return "Vui lòng nhập họ tên.";
  if (!form.email.trim()) return "Vui lòng nhập email.";
  if (!isValidEmail(form.email)) return "Email không hợp lệ.";
  if (!form.password) return "Vui lòng nhập mật khẩu.";
  if (form.password.length < PASSWORD_MIN_LENGTH) return `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`;
  return "";
}

// Mirrors UpdateStaffRequest's Bean Validation (@NotBlank fullName/email, @Email; no password field).
function validateEdit(form) {
  if (!form.fullName.trim()) return "Vui lòng nhập họ tên.";
  if (!form.email.trim()) return "Vui lòng nhập email.";
  if (!isValidEmail(form.email)) return "Email không hợp lệ.";
  return "";
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [createAttempted, setCreateAttempted] = useState(false);
  const [editAttempted, setEditAttempted] = useState(false);
  const createValidationError = createAttempted ? validateCreate(form) : "";
  const editValidationError = editAttempted ? validateEdit(editForm) : "";

  function load() {
    listStaff()
      .then(setStaff)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateAttempted(true);
    if (validateCreate(form)) return;
    setSaving(true);
    setError("");
    try {
      await createStaffAccount(form);
      setForm(emptyForm);
      setCreating(false);
      setCreateAttempted(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(account) {
    setEditingId(account.id);
    setEditForm({ fullName: account.fullName, email: account.email, phone: account.phone || "", role: account.role });
    setEditAttempted(false);
  }

  async function handleSaveEdit(id) {
    setEditAttempted(true);
    if (validateEdit(editForm)) return;
    setSaving(true);
    setError("");
    try {
      await updateStaffAccount(id, editForm);
      setEditingId(null);
      setEditAttempted(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Tài khoản nội bộ</h1>
        <button
          onClick={() => {
            setCreating((v) => !v);
            setForm(emptyForm);
            setCreateAttempted(false);
          }}
          className="bg-blue-900 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-800"
        >
          + Thêm tài khoản mới
        </button>
      </div>

      {error && <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

      {creating && (
        <form onSubmit={handleCreate} className="bg-white border rounded p-4 mb-4 space-y-3 max-w-md">
          {createValidationError && (
            <div className="rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{createValidationError}</div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Họ tên</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              type="text"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 8 ký tự</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">SĐT</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Vai trò</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="STAFF">Nhân viên (STAFF)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || !!createValidationError}
            className="bg-blue-900 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
        </form>
      )}

      {!staff ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <div className="bg-white border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Họ tên</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">SĐT</th>
                <th className="px-3 py-2">Vai trò</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) =>
                editingId === s.id ? (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{s.id}</td>
                    <td className="px-3 py-2">
                      <input
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="border rounded px-2 py-1 text-sm w-full"
                      >
                        <option value="STAFF">Nhân viên (STAFF)</option>
                        <option value="ADMIN">Quản trị viên (ADMIN)</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">{s.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}</td>
                    <td className="px-3 py-2">
                      {editValidationError && (
                        <div className="mb-1 rounded bg-red-50 border border-red-200 text-red-700 text-xs px-2 py-1 whitespace-nowrap">
                          {editValidationError}
                        </div>
                      )}
                      <button
                        disabled={saving || (editAttempted && !!editValidationError)}
                        onClick={() => handleSaveEdit(s.id)}
                        className="text-blue-700 hover:underline mr-3 disabled:opacity-50 disabled:no-underline"
                      >
                        Lưu
                      </button>
                      <button onClick={() => { setEditingId(null); setEditAttempted(false); }} className="text-gray-500 hover:underline">
                        Hủy
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{s.id}</td>
                    <td className="px-3 py-2">{s.fullName}</td>
                    <td className="px-3 py-2">{s.email}</td>
                    <td className="px-3 py-2">{s.phone}</td>
                    <td className="px-3 py-2">{s.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}</td>
                    <td className="px-3 py-2">{s.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => startEdit(s)} className="text-blue-700 hover:underline">
                        Sửa
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
