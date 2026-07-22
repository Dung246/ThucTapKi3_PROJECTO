import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getCart } from "../services/cartService";

const CartContext = createContext(null);

/** Shared so the navbar badge updates the moment any page (list/detail) adds an item — not just on auth changes. */
export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [itemCount, setItemCount] = useState(0);

  const refreshCart = useCallback(() => {
    if (isAuthenticated && user?.role === "CUSTOMER") {
      getCart()
        .then((cart) => setItemCount(cart.items.length))
        .catch(() => setItemCount(0));
    } else {
      setItemCount(0);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return <CartContext.Provider value={{ itemCount, refreshCart }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
