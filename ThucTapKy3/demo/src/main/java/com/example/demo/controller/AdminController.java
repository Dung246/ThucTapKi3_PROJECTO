package com.example.demo.controller;

import com.example.demo.dto.product.ProductResponse;
import com.example.demo.dto.user.CreateStaffRequest;
import com.example.demo.dto.user.UpdateStaffRequest;
import com.example.demo.dto.user.UpdateUserStatusRequest;
import com.example.demo.dto.user.UserResponse;
import com.example.demo.entity.ProductStatus;
import com.example.demo.service.AdminService;
import com.example.demo.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** All endpoints here are ADMIN-only (see SecurityConfig) - Nhan vien (STAFF) cannot lock customers or provision accounts, per SRS 2.5.1/2.5.2. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final ProductService productService;

    public AdminController(AdminService adminService, ProductService productService) {
        this.adminService = adminService;
        this.productService = productService;
    }

    /** Unlike GET /api/products, this includes INACTIVE (soft-deleted) products - closes the Day 3 KNOWN ISSUE gap. */
    @GetMapping("/products")
    public Page<ProductResponse> listProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) ProductStatus status,
            @PageableDefault(size = 20, sort = "id") Pageable pageable
    ) {
        return productService.searchAdmin(name, categoryId, status, pageable);
    }

    @GetMapping("/customers")
    public List<UserResponse> listCustomers() {
        return adminService.listCustomers();
    }

    @PatchMapping("/customers/{id}/status")
    public UserResponse updateCustomerStatus(@PathVariable Long id, @Valid @RequestBody UpdateUserStatusRequest request) {
        return adminService.updateCustomerStatus(id, request.status());
    }

    @GetMapping("/staff")
    public List<UserResponse> listStaff() {
        return adminService.listStaff();
    }

    @PostMapping("/staff")
    public ResponseEntity<UserResponse> createStaff(@Valid @RequestBody CreateStaffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createStaffAccount(request));
    }

    @PutMapping("/staff/{id}")
    public UserResponse updateStaff(@PathVariable Long id, @Valid @RequestBody UpdateStaffRequest request) {
        return adminService.updateStaffAccount(id, request);
    }

    /** multipart/form-data, field name "file" - validates content-type/size in ProductService.uploadImage(). */
    @PostMapping("/products/{id}/image")
    public ProductResponse uploadProductImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return productService.uploadImage(id, file);
    }
}
