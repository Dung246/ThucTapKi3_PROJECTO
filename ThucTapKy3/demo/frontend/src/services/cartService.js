import api from "./api";

export function getCart() {
  return api.get("/cart").then((res) => res.data);
}

export function addToCart(productId, quantity = 1) {
  return api.post("/cart", { productId, quantity }).then((res) => res.data);
}

export function updateCartItem(itemId, quantity) {
  return api.put(`/cart/${itemId}`, { quantity }).then((res) => res.data);
}

export function removeCartItem(itemId) {
  return api.delete(`/cart/${itemId}`).then((res) => res.data);
}
