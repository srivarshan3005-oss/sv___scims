package com.scims.service.impl;

import com.scims.dto.request.SubAdminRequest;
import com.scims.dto.response.PageResponse;
import com.scims.dto.response.SubAdminResponse;
import com.scims.entity.Department;
import com.scims.entity.Role;
import com.scims.entity.User;
import com.scims.exception.BadRequestException;
import com.scims.exception.ResourceNotFoundException;
import com.scims.repository.ComplaintRepository;
import com.scims.repository.DepartmentRepository;
import com.scims.repository.RoleRepository;
import com.scims.repository.UserRepository;
import com.scims.service.SubAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubAdminServiceImpl implements SubAdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SubAdminResponse> getAllSubAdmins(Long departmentId, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        String searchTerm = (search != null && !search.isBlank()) ? search : null;
        Page<User> subAdmins = userRepository.findAllSubAdmins(departmentId, searchTerm, pageable);
        return PageResponse.from(subAdmins.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public SubAdminResponse getSubAdminById(Long id) {
        User user = findSubAdminOrThrow(id);
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public SubAdminResponse createSubAdmin(SubAdminRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Password is required when creating a Sub Admin");
        }
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", request.getDepartmentId()));
        Role subAdminRole = roleRepository.findByName("ROLE_SUB_ADMIN")
                .orElseThrow(() -> new BadRequestException("ROLE_SUB_ADMIN not found — run the migration script"));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .isActive(true)
                .role(subAdminRole)
                .department(department)
                .build();
        User saved = userRepository.save(user);
        log.info("Sub Admin #{} ({}) created for department '{}'",
                saved.getId(), saved.getEmail(), department.getName());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public SubAdminResponse updateSubAdmin(Long id, SubAdminRequest request) {
        User user = findSubAdminOrThrow(id);

        if (!user.getEmail().equals(request.getEmail()) &&
            userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", request.getDepartmentId()));

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setDepartment(department);

        // Only re-hash and update the password when one was actually provided.
        // Leaving it blank on an update means "keep current password".
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User saved = userRepository.save(user);
        log.info("Sub Admin #{} updated", saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public SubAdminResponse toggleSubAdminStatus(Long id) {
        User user = findSubAdminOrThrow(id);
        user.setIsActive(!user.getIsActive());
        log.info("Sub Admin #{} ({}) status toggled to {}", id, user.getEmail(), user.getIsActive());
        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteSubAdmin(Long id) {
        User user = findSubAdminOrThrow(id);
        // Soft delete, consistent with citizen deactivation — preserves
        // complaint history (assignedTo, statusHistory.changedBy) for audit.
        user.setIsActive(false);
        userRepository.save(user);
        log.info("Sub Admin #{} soft-deleted (deactivated)", id);
    }

    private User findSubAdminOrThrow(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sub Admin", id));
        if (!"ROLE_SUB_ADMIN".equals(user.getRole().getName())) {
            throw new ResourceNotFoundException("Sub Admin", id);
        }
        return user;
    }

    private SubAdminResponse mapToResponse(User u) {
        long complaintsHandled = u.getDepartment() != null
                ? complaintRepository.countByDepartmentId(u.getDepartment().getId())
                : 0;
        String profileImageUrl = null;
        if (u.getProfileImage() != null && !u.getProfileImage().isBlank()) {
            profileImageUrl = "/uploads/" + u.getProfileImage();
        }
        return SubAdminResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .address(u.getAddress())
                .profileImage(profileImageUrl)
                .isActive(u.getIsActive())
                .departmentId(u.getDepartment() != null ? u.getDepartment().getId() : null)
                .departmentName(u.getDepartment() != null ? u.getDepartment().getName() : null)
                .createdAt(u.getCreatedAt())
                .complaintsHandled(complaintsHandled)
                .build();
    }
}
