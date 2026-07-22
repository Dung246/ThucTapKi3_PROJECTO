import { useEffect, useState } from "react";
import { listCustomers, updateCustomerStatus } from "../../services/adminService";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [pendingLock, setPendingLock] = useState(null);

  function load() {
    listCustomers()
      .then(setCustomers)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function applyStatus(customer, nextStatus) {
    setBusyId(customer.id);
    setError("");
    try {
      await updateCustomerStatus(customer.id, nextStatus);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // Locking is the destructive/hard-to-reverse-for-the-customer direction (they're immediately
  // shut out) so it gets a confirmation popup; unlocking is the safe direction and applies
  // immediately, same as before.
  function toggleLock(customer) {
    if (customer.status === "ACTIVE") {
      setPendingLock(customer);
    } else {
      applyStatus(customer, "ACTIVE");
    }
  }

  function confirmLock() {
    const customer = pendingLock;
    setPendingLock(null);
    applyStatus(customer, "LOCKED");
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Khách hàng</h1>

      {error && <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

      {!customers ? (
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
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{c.id}</td>
                  <td className="px-3 py-2">{c.fullName}</td>
                  <td className="px-3 py-2">{c.email}</td>
                  <td className="px-3 py-2">{c.phone}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        c.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      disabled={busyId === c.id}
                      onClick={() => toggleLock(c)}
                      className={`text-sm hover:underline ${c.status === "ACTIVE" ? "text-red-600" : "text-blue-700"}`}
                    >
                      {c.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    Chưa có khách hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingLock}
        title="Khóa tài khoản"
        message={`Bạn có chắc chắn muốn khóa tài khoản "${pendingLock?.email}"? Khách hàng sẽ không thể đăng nhập.`}
        confirmLabel="Khóa tài khoản"
        danger
        onConfirm={confirmLock}
        onCancel={() => setPendingLock(null)}
      />
    </div>
  );
}
