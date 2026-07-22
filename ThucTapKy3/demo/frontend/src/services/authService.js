import api from "./api";

export function register({ fullName, email, password, phone }) {
  return api.post("/auth/register", { fullName, email, password, phone }).then((res) => res.data);
}

export function login({ email, password }) {
  return api.post("/auth/login", { email, password }).then((res) => res.data);
}
