import api from "./api";

export function getRevenue({ granularity = "DAY", from, to } = {}) {
  return api.get("/admin/statistics/revenue", { params: { granularity, from, to } }).then((res) => res.data);
}

export function getTopProducts({ from, to, limit = 10 } = {}) {
  return api.get("/admin/statistics/top-products", { params: { from, to, limit } }).then((res) => res.data);
}
