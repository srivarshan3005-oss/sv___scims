package com.scims.service.impl;

import com.scims.dto.request.LoginRequest;
import com.scims.dto.request.RegisterRequest;
import com.scims.dto.response.JwtResponse;
import com.scims.dto.response.UserResponse;
import com.scims.entity.Role;
import com.scims.entity.User;
import com.scims.exception.BadRequestException;
import com.scims.repository.RoleRepository;
import com.scims.repository.UserRepository;
import com.scims.security.JwtUtils;
import com.scims.security.UserDetailsImpl;
import com.scims.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Override
public JwtResponse login(LoginRequest request) {

    System.out.println("=================================");
    System.out.println("LOGIN ATTEMPT");
    System.out.println("EMAIL = " + request.getEmail());
    System.out.println("PASSWORD = " + request.getPassword());
    System.out.println("=================================");

    Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
            )
    );

    SecurityContextHolder.getContext().setAuthentication(authentication);

    String jwt = jwtUtils.generateToken(authentication);

    UserDetailsImpl userDetails =
            (UserDetailsImpl) authentication.getPrincipal();

    String role = userDetails.getAuthorities().stream()
            .findFirst()
            .map(a -> a.getAuthority())
            .orElse("");

    return JwtResponse.builder()
            .token(jwt)
            .type("Bearer")
            .id(userDetails.getId())
            .fullName(userDetails.getFullName())
            .email(userDetails.getUsername())
            .role(role)
            .build();
}

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }
        Role citizenRole = roleRepository.findByName("ROLE_CITIZEN")
                .orElseThrow(() -> new BadRequestException("Default role not found"));
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .isActive(true)
                .role(citizenRole)
                .build();
        User saved = userRepository.save(user);
        return UserResponse.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .address(saved.getAddress())
                .isActive(saved.getIsActive())
                .role(saved.getRole().getName())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
