package com.example.demo.service;

import com.example.demo.dto.user.CreateStaffRequest;
import com.example.demo.dto.user.UpdateStaffRequest;
import com.example.demo.dto.user.UserResponse;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.entity.UserStatus;
import com.example.demo.exception.DuplicateEmailException;
import com.example.demo.exception.InvalidStaffRoleException;
import com.example.demo.exception.UserNotFoundException;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final AuthService authService;

    public AdminService(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listCustomers() {
        return userRepository.findByRoleIn(List.of(Role.CUSTOMER)).stream().map(UserResponse::from).toList();
    }

    /** Scoped to role=CUSTOMER only: an ADMIN cannot lock another STAFF/ADMIN account through this endpoint. */
    @Transactional
    public UserResponse updateCustomerStatus(Long customerId, UserStatus status) {
        User user = userRepository.findById(customerId)
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .orElseThrow(() -> new UserNotFoundException(customerId));

        user.setStatus(status);
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listStaff() {
        return userRepository.findByRoleIn(List.of(Role.STAFF, Role.ADMIN)).stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse createStaffAccount(CreateStaffRequest request) {
        validateStaffRole(request.role());

        User user = authService.createAccount(request.fullName(), request.email(), request.password(), request.phone(), request.role());
        return UserResponse.from(user);
    }

    /** UC-12 "sửa tài khoản Nhân viên" — edits an existing STAFF/ADMIN account's basic fields + role. No password reset here (out of today's scope). */
    @Transactional
    public UserResponse updateStaffAccount(Long id, UpdateStaffRequest request) {
        validateStaffRole(request.role());

        User user = userRepository.findById(id)
                .filter(u -> u.getRole() == Role.STAFF || u.getRole() == Role.ADMIN)
                .orElseThrow(() -> new UserNotFoundException(id));

        if (userRepository.existsByEmailAndIdNot(request.email(), id)) {
            throw new DuplicateEmailException(request.email());
        }

        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setRole(request.role());

        return UserResponse.from(user);
    }

    /** Shared by create and update: Role has a third value (CUSTOMER) that Bean Validation's @NotNull can't exclude on its own. */
    private void validateStaffRole(Role role) {
        if (role != Role.STAFF && role != Role.ADMIN) {
            throw new InvalidStaffRoleException();
        }
    }
}
