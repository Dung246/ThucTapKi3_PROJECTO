package com.example.demo.dto.review;

import java.util.List;

public record ProductReviewsResponse(
        Long productId,
        double averageRating,
        int reviewCount,
        List<ReviewResponse> reviews
) {
    public static ProductReviewsResponse of(Long productId, List<ReviewResponse> reviews) {
        double average = reviews.stream().mapToInt(ReviewResponse::rating).average().orElse(0.0);
        return new ProductReviewsResponse(productId, average, reviews.size(), reviews);
    }
}
