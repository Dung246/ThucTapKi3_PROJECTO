import api from "./api";

export function createOrder({ shippingAddress, paymentMethod }) {
  return api.post("/orders", { shippingAddress, paymentMethod }).then((res) => res.data);
}

export function getOrders() {
  return api.get("/orders").then((res) => res.data);
}

export function getOrder(id) {
  return api.get(`/orders/${id}`).then((res) => res.data);
}
