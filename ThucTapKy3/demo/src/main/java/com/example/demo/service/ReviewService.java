package com.example.demo.service;

import com.example.demo.dto.review.ProductReviewsResponse;
import com.example.demo.dto.review.ReviewRequest;
import com.example.demo.dto.review.ReviewResponse;
import com.example.demo.entity.OrderStatus;
import com.example.demo.entity.Product;
import com.example.demo.entity.Review;
import com.example.demo.entity.User;
import com.example.demo.exception.DuplicateReviewException;
import com.example.demo.exception.ProductNotFoundException;
import com.example.demo.exception.ReviewNotEligibleException;
import com.example.demo.repository.OrderDetailRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.ReviewRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository,
                          OrderDetailRepository orderDetailRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReviewResponse create(Long userId, Long productId, ReviewRequest request) {
        Product product = productRepository.findById(productId).orElseThrow(() -> new ProductNotFoundException(productId));

        boolean eligible = orderDetailRepository.existsByProduct_IdAndOrder_User_IdAndOrder_Status(
                productId, userId, OrderStatus.COMPLETED);
        if (!eligible) {
            throw new ReviewNotEligibleException();
        }

        if (reviewRepository.existsByProduct_IdAndUser_Id(productId, userId)) {
            throw new DuplicateReviewException();
        }

        User user = userRepository.getReferenceById(userId);
        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(request.rating())
                .comment(request.comment())
                .build();

        return ReviewResponse.from(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public ProductReviewsResponse list(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ProductNotFoundException(productId);
        }

        var reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(ReviewResponse::from)
                .toList();

        return ProductReviewsResponse.of(productId, reviews);
    }
}
