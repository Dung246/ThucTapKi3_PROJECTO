package com.example.demo.security;

import com.example.demo.entity.Role;
import org.springframework.security.core.Authentication;

/** JwtAuthenticationFilter sets principal=userId (Long) and a single ROLE_<role> authority; these helpers unpack that. */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Long currentUserId(Authentication authentication) {
        return (Long) authentication.getPrincipal();
    }

    public static Role currentRole(Authentication authentication) {
        String authority = authentication.getAuthorities().iterator().next().getAuthority();
        return Role.valueOf(authority.substring("ROLE_".length()));
    }
}
