import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isValidEmail } from "../utils/validation";

function validate(form) {
  if (!form.email.trim()) return "Vui lòng nhập email.";
  if (!isValidEmail(form.email)) return "Email không hợp lệ.";
  if (!form.password) return "Vui lòng nhập mật khẩu.";
  return "";
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const validationError = attempted ? validate(form) : "";
  // Set by services/api.js's response interceptor when a request 401s due to an expired/invalid
  // JWT (see SRS Part 4's "Phien het han" standard message), not by a wrong-password attempt here.
  const sessionExpired = searchParams.get("sessionExpired") === "1";

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
      await login(form);
      navigate("/products");
    } catch (err) {
      // Reuses the backend's message directly: "Invalid email or password" (401) or
      // "This account has been locked. Contact an administrator." (403).
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow rounded p-6">
      <h1 className="text-xl font-semibold mb-4">Đăng nhập</h1>

      {sessionExpired && !error && (
        <div className="mb-4 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2">
          Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.
        </div>
      )}

      {(validationError || error) && (
        <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {validationError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
        </div>
        <button
          type="submit"
          disabled={submitting || !!validationError}
          className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800 disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-4">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="text-blue-700 hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
