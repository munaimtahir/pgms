from __future__ import annotations

from rest_framework import permissions


class EnforceUserStatusPermission(permissions.BasePermission):
    """
    Global permission class to restrict authenticated users who:
    - Must change their password (must_change_password = True)
    - Have an incomplete profile (is_profile_complete = False)
    
    Permitted endpoints for restricted users are:
    - /api/auth/me/ (auth-me)
    - /api/auth/change-password/ (auth-change-password)
    - /api/auth/complete-profile/ (auth-complete-profile)
    - /api/auth/logout/ (auth-logout)
    - /api/auth/refresh/ (auth-refresh)
    """

    def has_permission(self, request, view) -> bool:
        # If user is not authenticated, let standard authentication permissions (e.g. IsAuthenticated) handle it.
        if not request.user or not request.user.is_authenticated:
            return True

        resolver_match = request.resolver_match
        if not resolver_match:
            return True

        url_name = resolver_match.url_name

        # URL names that restricted users are allowed to hit
        allowed_url_names = {
            "auth-me",
            "auth-change-password",
            "auth-complete-profile",
            "auth-logout",
            "auth-refresh",
            "health-check",
        }

        # 1. Enforce password change restriction
        if request.user.must_change_password:
            return url_name in {"auth-change-password", "auth-me", "auth-logout", "auth-refresh"}

        # 2. Enforce profile completion restriction
        if not request.user.is_profile_complete:
            return url_name in allowed_url_names

        return True


class IsUtrmcAdmin(permissions.BasePermission):
    """
    Permission class that only allows UTRMC Admins.
    """

    def has_permission(self, request, view) -> bool:
        return (
            request.user
            and request.user.is_authenticated
            and request.user.user_category == "UTRMC_ADMIN"
        )
