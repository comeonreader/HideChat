package com.hidechat.security.context;

import com.hidechat.common.exception.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserProvider {

    public String getRequiredUserUid() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException(401001, "未登录或 token 无效");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof String principalUserUid && !principalUserUid.isBlank()) {
            return principalUserUid;
        }
        Object details = authentication.getDetails();
        if (details instanceof AuthenticatedUser authenticatedUser) {
            return authenticatedUser.userUid();
        }
        throw new BusinessException(401001, "未登录或 token 无效");
    }
}
