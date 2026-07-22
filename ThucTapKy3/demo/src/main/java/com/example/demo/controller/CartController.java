package com.example.demo.controller;

import com.example.demo.dto.cart.AddCartItemRequest;
import com.example.demo.dto.cart.CartItemResponse;
import com.example.demo.dto.cart.CartResponse;
import com.example.demo.dto.cart.UpdateCartItemRequest;
import com.example.demo.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public CartResponse getCart(@AuthenticationPrincipal Long userId) {
        return cartService.getCart(userId);
    }

    @PostMapping
    public ResponseEntity<CartItemResponse> addItem(@AuthenticationPrincipal Long userId, @Valid @RequestBody AddCartItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cartService.addItem(userId, request));
    }

    @PutMapping("/{itemId}")
    public CartItemResponse updateQuantity(@AuthenticationPrincipal Long userId, @PathVariable Long itemId, @Valid @RequestBody UpdateCartItemRequest request) {
        return cartService.updateQuantity(userId, itemId, request);
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> removeItem(@AuthenticationPrincipal Long userId, @PathVariable Long itemId) {
        cartService.removeItem(userId, itemId);
        return ResponseEntity.noContent().build();
    }
}
