import { useAuth } from "../context/AuthContext";

export default function AccountPage() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-md bg-white border rounded p-6">
      <h1 className="text-lg font-semibold mb-4">Tài khoản của tôi</h1>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Họ và tên</dt>
          <dd className="font-medium">{user?.fullName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium">{user?.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Vai trò</dt>
          <dd className="font-medium">{user?.role}</dd>
        </div>
      </dl>
      <button onClick={logout} className="mt-6 bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800">
        Đăng xuất
      </button>
    </div>
  );
}
