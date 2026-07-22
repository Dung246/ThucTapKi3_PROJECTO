import api from "./api";

export function getProductReviews(productId) {
  return api.get(`/products/${productId}/reviews`).then((res) => res.data);
}

export function submitReview(productId, { rating, comment }) {
  return api.post(`/products/${productId}/reviews`, { rating, comment }).then((res) => res.data);
}
