import api from "./api";

export function searchProducts({ name, categoryId, minPrice, maxPrice, page = 0, size = 12 } = {}) {
  return api
    .get("/products", { params: { name, categoryId, minPrice, maxPrice, page, size } })
    .then((res) => res.data);
}

export function getProduct(id) {
  return api.get(`/products/${id}`).then((res) => res.data);
}

export function getCategories() {
  return api.get("/categories").then((res) => res.data);
}
