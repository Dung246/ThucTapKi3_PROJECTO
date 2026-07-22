// Single source of truth for order-status display: Vietnamese labels reused by OrdersPage,
// OrderDetailPage, and anywhere else a status needs to render. Keeping the mapping here (instead
// of repeating it per component) means the labels stay consistent and the state diagram
// (Ban_hang_SRS.docx Hinh 2.4) only needs to be translated to Vietnamese in one place.
export const ORDER_STATUS_LABELS = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export const ORDER_STATUS_BADGE_CLASSES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const PAYMENT_METHOD_LABELS = {
  COD: "Thanh toán khi nhận hàng (COD)",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
};

export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status;
}

// Mirrors OrderService.ALLOWED_TRANSITIONS on the backend (Ban_hang_SRS.docx Hinh 2.4) so the Admin
// order page can grey out invalid transitions instead of letting Staff/Admin click and hit a 409.
export const ALLOWED_STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const ORDER_STATUS_FILTERS = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];
