import axios from "axios";

// Local dev default; overridden by VITE_API_BASE_URL for other environments (e.g. Day 8's dockerized frontend).
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// The backend's origin without the "/api" prefix - uploaded product images are served as static
// files under /uploads/**, a sibling of /api, not underneath it (see WebConfig.java).
const API_ORIGIN = baseURL.replace(/\/api\/?$/, "");

// product.imageUrl is either a relative uploaded-file path ("/uploads/<uuid>.jpg", from the new
// upload endpoint) or, for older/seed data created via the still-supported imageUrl text field, a
// full external URL. Resolve the former against the backend's origin; pass the latter through
// unchanged so external URLs keep working.
export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${API_ORIGIN}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalizes the backend's {timestamp, status, message} error shape into a plain message string
// so every page can just do `catch (err) { setError(err.message) }`.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 on any endpoint OTHER than login/register means we sent a token the backend rejected
    // (expired or otherwise invalid) - not a wrong-password login attempt, which is handled inline
    // on LoginPage instead. Per SRS Part 4's "Phien het han" pattern: clear the stale session and
    // send the user back to login with the standard message, rather than surfacing the backend's
    // raw "Missing or invalid authentication token" text.
    const isAuthEndpoint = error.config?.url?.includes("/auth/");
    if (error.response?.status === 401 && !isAuthEndpoint && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login?sessionExpired=1";
      return new Promise(() => {}); // navigation is in flight; no caller should handle this rejection
    }

    const message = error.response?.data?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default api;
