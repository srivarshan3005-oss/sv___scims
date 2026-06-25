package com.scims.security;

import com.scims.entity.User;
import com.scims.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + email));

        /**
         * Do NOT throw UsernameNotFoundException for disabled users here.
         * UserDetailsImpl.isEnabled() now returns the real isActive value.
         * Spring Security's DaoAuthenticationProvider calls isEnabled() and
         * automatically throws DisabledException when it returns false,
         * which is handled properly by GlobalExceptionHandler.handleDisabled().
         */
        return UserDetailsImpl.build(user);
    }
}
