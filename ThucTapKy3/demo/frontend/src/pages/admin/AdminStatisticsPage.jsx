import { useEffect, useState } from "react";
import { getRevenue, getTopProducts } from "../../services/statisticsService";
import RevenueBarChart from "../../components/RevenueBarChart";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function AdminStatisticsPage() {
  const [granularity, setGranularity] = useState("DAY");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState({ granularity: "DAY", from: "", to: "" });

  const [revenue, setRevenue] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all([
      getRevenue({ granularity: applied.granularity, from: applied.from || undefined, to: applied.to || undefined }),
      getTopProducts({ from: applied.from || undefined, to: applied.to || undefined, limit: 10 }),
    ])
      .then(([rev, top]) => {
        setRevenue(rev);
        setTopProducts(top);
      })
      .catch((err) => setError(err.message));
  }, [applied]);

  function applyFilters(e) {
    e.preventDefault();
    setApplied({ granularity, from, to });
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Thống kê</h1>

      <form onSubmit={applyFilters} className="bg-white border rounded p-3 mb-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Theo</label>
          <select value={granularity} onChange={(e) => setGranularity(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="DAY">Ngày</option>
            <option value="MONTH">Tháng</option>
            <option value="YEAR">Năm</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-900 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-800">
          Áp dụng
        </button>
      </form>

      {error && <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold text-sm mb-3">Doanh thu</h2>
        {revenue ? <RevenueBarChart data={revenue} /> : <p className="text-sm text-gray-500">Đang tải...</p>}
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold text-sm mb-3">Sản phẩm bán chạy</h2>
        {!topProducts ? (
          <p className="text-sm text-gray-500">Đang tải...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Sản phẩm</th>
                <th className="pb-2 text-right">SL đã bán</th>
                <th className="pb-2 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.productId} className="border-b last:border-0">
                  <td className="py-2">{p.productName}</td>
                  <td className="py-2 text-right">{p.quantitySold}</td>
                  <td className="py-2 text-right font-medium">{currency.format(p.revenue)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
