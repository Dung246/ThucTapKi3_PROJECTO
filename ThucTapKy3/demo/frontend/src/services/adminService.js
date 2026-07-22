import api from "./api";

// --- Products (admin: includes INACTIVE, unlike the public search) ---
export function listAdminProducts({ name, categoryId, status, page = 0, size = 20 } = {}) {
  return api.get("/admin/products", { params: { name, categoryId, status, page, size } }).then((res) => res.data);
}

export function createProduct(product) {
  return api.post("/products", product).then((res) => res.data);
}

export function updateProduct(id, product) {
  return api.put(`/products/${id}`, product).then((res) => res.data);
}

export function deleteProduct(id) {
  return api.delete(`/products/${id}`).then((res) => res.data);
}

// `file` is a browser File object; axios sets the multipart/form-data Content-Type (with the
// correct boundary) automatically from the FormData body - do not set it manually here.
export function uploadProductImage(id, file) {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/admin/products/${id}/image`, formData).then((res) => res.data);
}

// --- Categories ---
export function createCategory(category) {
  return api.post("/categories", category).then((res) => res.data);
}

export function updateCategory(id, category) {
  return api.put(`/categories/${id}`, category).then((res) => res.data);
}

export function deleteCategory(id) {
  return api.delete(`/categories/${id}`).then((res) => res.data);
}

// --- Orders (admin/staff: list all + update status; reuses the shared /orders endpoints) ---
export function listAllOrders(status) {
  return api.get("/orders", { params: { status } }).then((res) => res.data);
}

export function updateOrderStatus(id, { status, note }) {
  return api.patch(`/orders/${id}/status`, { status, note }).then((res) => res.data);
}

// --- Customers ---
export function listCustomers() {
  return api.get("/admin/customers").then((res) => res.data);
}

export function updateCustomerStatus(id, status) {
  return api.patch(`/admin/customers/${id}/status`, { status }).then((res) => res.data);
}

// --- Staff/internal accounts ---
export function listStaff() {
  return api.get("/admin/staff").then((res) => res.data);
}

export function createStaffAccount(account) {
  return api.post("/admin/staff", account).then((res) => res.data);
}

export function updateStaffAccount(id, account) {
  return api.put(`/admin/staff/${id}`, account).then((res) => res.data);
}
