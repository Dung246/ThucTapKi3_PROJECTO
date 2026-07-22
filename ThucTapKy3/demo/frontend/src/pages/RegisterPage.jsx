import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isValidEmail, PASSWORD_MIN_LENGTH } from "../utils/validation";

// Mirrors RegisterRequest's Bean Validation exactly (@NotBlank fullName/email/password, @Email, @Size(min=8)).
function validate(form) {
  if (!form.fullName.trim()) return "Vui lòng nhập họ và tên.";
  if (!form.email.trim()) return "Vui lòng nhập email.";
  if (!isValidEmail(form.email)) return "Email không hợp lệ.";
  if (!form.password) return "Vui lòng nhập mật khẩu.";
  if (form.password.length < PASSWORD_MIN_LENGTH) return `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`;
  return "";
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Only starts showing/enforcing live validation after the first submit attempt, so the button
  // isn't pre-disabled on an untouched form (which would make the first click do nothing visible).
  const [attempted, setAttempted] = useState(false);
  const validationError = attempted ? validate(form) : "";

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setAttempted(true);
    if (validate(form)) return;
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow rounded p-6">
      <h1 className="text-xl font-semibold mb-4">Đăng ký tài khoản</h1>

      {(validationError || error) && (
        <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {validationError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Họ và tên</label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="text"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">Tối thiểu 8 ký tự</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Số điện thoại</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !!validationError}
          className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800 disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Đăng ký"}
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-4">
        Đã có tài khoản?{" "}
        <Link to="/login" className="text-blue-700 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
