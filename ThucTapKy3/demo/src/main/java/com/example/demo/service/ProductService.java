package com.example.demo.service;

import com.example.demo.dto.product.ProductRequest;
import com.example.demo.dto.product.ProductResponse;
import com.example.demo.entity.Category;
import com.example.demo.entity.Product;
import com.example.demo.entity.ProductStatus;
import com.example.demo.exception.CategoryNotFoundException;
import com.example.demo.exception.DuplicateProductNameException;
import com.example.demo.exception.ImageTooLargeException;
import com.example.demo.exception.InvalidImageTypeException;
import com.example.demo.exception.ProductNotFoundException;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.spec.ProductSpecifications;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class ProductService {

    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final String uploadDir;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository,
                           @Value("${app.upload.dir}") String uploadDir) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.uploadDir = uploadDir;
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> search(String name, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        Specification<Product> spec = ProductSpecifications.hasStatus(ProductStatus.ACTIVE);

        if (name != null && !name.isBlank()) {
            spec = spec.and(ProductSpecifications.nameContains(name));
        }
        if (categoryId != null) {
            spec = spec.and(ProductSpecifications.hasCategory(categoryId));
        }
        if (minPrice != null) {
            spec = spec.and(ProductSpecifications.priceGreaterThanOrEqual(minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and(ProductSpecifications.priceLessThanOrEqual(maxPrice));
        }

        return productRepository.findAll(spec, pageable).map(ProductResponse::from);
    }

    /** Admin-facing listing: includes INACTIVE (soft-deleted) products, unlike the customer-facing search() above. */
    @Transactional(readOnly = true)
    public Page<ProductResponse> searchAdmin(String name, Long categoryId, ProductStatus status, Pageable pageable) {
        Specification<Product> spec = (root, query, cb) -> cb.conjunction();

        if (name != null && !name.isBlank()) {
            spec = spec.and(ProductSpecifications.nameContains(name));
        }
        if (categoryId != null) {
            spec = spec.and(ProductSpecifications.hasCategory(categoryId));
        }
        if (status != null) {
            spec = spec.and(ProductSpecifications.hasStatus(status));
        }

        return productRepository.findAll(spec, pageable).map(ProductResponse::from);
    }

    /** Customer-facing detail lookup: only ACTIVE products are visible (UC-04). */
    @Transactional(readOnly = true)
    public ProductResponse findActiveById(Long id) {
        Product product = productRepository.findById(id)
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .orElseThrow(() -> new ProductNotFoundException(id));
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        if (productRepository.existsByName(request.name())) {
            throw new DuplicateProductNameException(request.name());
        }

        Category category = getCategoryOrThrow(request.categoryId());

        Product product = Product.builder()
                .name(request.name())
                .category(category)
                .price(request.price())
                .quantity(request.quantity())
                .imageUrl(request.imageUrl())
                .description(request.description())
                .status(ProductStatus.ACTIVE)
                .build();

        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException(id));

        if (productRepository.existsByNameAndIdNot(request.name(), id)) {
            throw new DuplicateProductNameException(request.name());
        }

        Category category = getCategoryOrThrow(request.categoryId());

        product.setName(request.name());
        product.setCategory(category);
        product.setPrice(request.price());
        product.setQuantity(request.quantity());
        product.setImageUrl(request.imageUrl());
        product.setDescription(request.description());

        return ProductResponse.from(product);
    }

    /** Always soft delete: set status = INACTIVE, never remove the row (SRS 3.3 / UC-09). */
    @Transactional
    public void softDelete(Long id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException(id));
        product.setStatus(ProductStatus.INACTIVE);
    }

    /**
     * Saves an uploaded image to the local uploads volume (see docs.txt KEY DECISIONS for
     * local-volume-vs-cloud-storage rationale) and points the product's image_url at it. Works for
     * both a product with no image yet and one whose existing image is being replaced - the old
     * file is intentionally left in place rather than deleted (simpler, and still safely reachable
     * if something else pointed at it; acceptable orphaned-file cost at this project's scale).
     */
    @Transactional
    public ProductResponse uploadImage(Long id, MultipartFile file) {
        Product product = productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException(id));

        if (file == null || file.isEmpty()) {
            throw new InvalidImageTypeException("File must not be empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new InvalidImageTypeException("File must be an image (received content-type: " + contentType + ")");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new ImageTooLargeException(MAX_IMAGE_BYTES);
        }

        String filename = UUID.randomUUID() + extractExtension(file.getOriginalFilename());
        try {
            Path targetDir = Path.of(uploadDir);
            Files.createDirectories(targetDir);
            file.transferTo(targetDir.resolve(filename));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store product image", e);
        }

        product.setImageUrl("/uploads/" + filename);
        return ProductResponse.from(product);
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null) {
            return "";
        }
        int dot = originalFilename.lastIndexOf('.');
        return dot >= 0 ? originalFilename.substring(dot) : "";
    }

    private Category getCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId).orElseThrow(() -> new CategoryNotFoundException(categoryId));
    }
}
