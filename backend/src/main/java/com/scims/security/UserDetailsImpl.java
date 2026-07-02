package com.scims.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.scims.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@AllArgsConstructor
@Getter
public class UserDetailsImpl implements UserDetails {

    private Long id;
    private String email;
    private String fullName;
    private boolean active;

    // Only set for ROLE_SUB_ADMIN principals — which department they
    // belong to. Null for Super Admin and Citizen.
    private Long departmentId;

    @JsonIgnore
    private String password;

    private Collection<? extends GrantedAuthority> authorities;

    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority(user.getRole().getName())
        );
        return new UserDetailsImpl(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                Boolean.TRUE.equals(user.getIsActive()),
                user.getDepartment() != null ? user.getDepartment().getId() : null,
                user.getPassword(),
                authorities
        );
    }

    @Override public String getUsername()   { return email; }
    @Override public String getPassword()   { return password; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isAccountNonLocked()     { return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }

    /**
     * Return actual active status so Spring Security calls DisabledException
     * automatically when isEnabled() returns false, which is then caught by
     * GlobalExceptionHandler.handleDisabled() and returns HTTP 401 with a
     * clear message — instead of a confusing 500 error.
     */
    @Override public boolean isEnabled() { return active; }
}
