package com.example.demo.service;

import com.example.demo.dto.cart.AddCartItemRequest;
import com.example.demo.dto.cart.CartItemResponse;
import com.example.demo.dto.cart.CartResponse;
import com.example.demo.dto.cart.UpdateCartItemRequest;
import com.example.demo.entity.CartItem;
import com.example.demo.entity.Product;
import com.example.demo.entity.ProductStatus;
import com.example.demo.exception.CartItemNotFoundException;
import com.example.demo.exception.ProductNotFoundException;
import com.example.demo.exception.ProductOutOfStockException;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartService(CartItemRepository cartItemRepository, ProductRepository productRepository, UserRepository userRepository) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        var items = cartItemRepository.findByUserId(userId).stream().map(CartItemResponse::from).toList();
        return CartResponse.of(items);
    }

    @Transactional
    public CartItemResponse addItem(Long userId, AddCartItemRequest request) {
        Product product = productRepository.findById(request.productId())
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .orElseThrow(() -> new ProductNotFoundException(request.productId()));

        if (product.getQuantity() <= 0) {
            throw new ProductOutOfStockException(product.getId());
        }

        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, request.productId())
                .orElseGet(() -> CartItem.builder()
                        .user(userRepository.getReferenceById(userId))
                        .product(product)
                        .quantity(0)
                        .build());

        // Cap at current stock rather than rejecting (UC-05 exception flow).
        int cappedQuantity = Math.min(item.getQuantity() + request.quantity(), product.getQuantity());
        item.setQuantity(cappedQuantity);

        return CartItemResponse.from(cartItemRepository.save(item));
    }

    @Transactional
    public CartItemResponse updateQuantity(Long userId, Long itemId, UpdateCartItemRequest request) {
        CartItem item = getOwnedItemOrThrow(userId, itemId);
        Product product = item.getProduct();

        if (product.getQuantity() <= 0) {
            throw new ProductOutOfStockException(product.getId());
        }

        item.setQuantity(Math.min(request.quantity(), product.getQuantity()));
        return CartItemResponse.from(item);
    }

    @Transactional
    public void removeItem(Long userId, Long itemId) {
        CartItem item = getOwnedItemOrThrow(userId, itemId);
        cartItemRepository.delete(item);
    }

    /** Scoped to (itemId, userId) so a different user's cart item is indistinguishable from a missing one (no cross-user access). */
    private CartItem getOwnedItemOrThrow(Long userId, Long itemId) {
        return cartItemRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new CartItemNotFoundException(itemId));
    }
}
