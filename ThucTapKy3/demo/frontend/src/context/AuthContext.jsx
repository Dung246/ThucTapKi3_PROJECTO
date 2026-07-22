import { createContext, useContext, useState } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

function readStoredUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function persist(authResponse) {
  const { token, ...user } = authResponse;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(readStoredUser);

  async function login(credentials) {
    const data = await authService.login(credentials);
    setUser(persist(data));
    setToken(data.token);
    return data;
  }

  // Register returns a token too (see AuthResponse), so a new customer is signed in immediately.
  async function register(details) {
    const data = await authService.register(details);
    setUser(persist(data));
    setToken(data.token);
    return data;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  const value = { user, token, isAuthenticated: !!token, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
