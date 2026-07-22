package com.example.demo.dto.product;

import com.example.demo.entity.Product;
import com.example.demo.entity.ProductStatus;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        String name,
        Long categoryId,
        String categoryName,
        BigDecimal price,
        Integer quantity,
        String imageUrl,
        String description,
        ProductStatus status
) {
    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getPrice(),
                product.getQuantity(),
                product.getImageUrl(),
                product.getDescription(),
                product.getStatus()
        );
    }
}
