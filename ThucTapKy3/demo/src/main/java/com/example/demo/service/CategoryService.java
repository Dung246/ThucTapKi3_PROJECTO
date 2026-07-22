package com.example.demo.service;

import com.example.demo.dto.category.CategoryRequest;
import com.example.demo.dto.category.CategoryResponse;
import com.example.demo.entity.Category;
import com.example.demo.exception.CategoryHasProductsException;
import com.example.demo.exception.CategoryNotFoundException;
import com.example.demo.exception.DuplicateCategoryNameException;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream().map(CategoryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(Long id) {
        return CategoryResponse.from(getOrThrow(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByName(request.name())) {
            throw new DuplicateCategoryNameException(request.name());
        }

        Category category = Category.builder()
                .name(request.name())
                .description(request.description())
                .build();

        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = getOrThrow(id);

        if (categoryRepository.existsByNameAndIdNot(request.name(), id)) {
            throw new DuplicateCategoryNameException(request.name());
        }

        category.setName(request.name());
        category.setDescription(request.description());

        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(Long id) {
        Category category = getOrThrow(id);

        // Business rule: a category with existing products cannot be deleted (would orphan
        // product.category_id, which is NOT NULL). Caller must reassign/delete those products first.
        if (productRepository.existsByCategoryId(id)) {
            throw new CategoryHasProductsException(id);
        }

        categoryRepository.delete(category);
    }

    private Category getOrThrow(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> new CategoryNotFoundException(id));
    }
}
