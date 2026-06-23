from __future__ import annotations

from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission class:
    - Admin: Full CRUD access.
    - Others: Read-only (SAFE_METHODS) if authenticated.
    """

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.user_category == "UTRMC_ADMIN":
            return True

        # Check if the user has an active UserRoleAssignment with UTRMC_ADMIN_ACCESS
        from access.models import UserRoleAssignment
        if UserRoleAssignment.objects.filter(
            user=request.user,
            role=UserRoleAssignment.Role.UTRMC_ADMIN_ACCESS,
            is_active=True,
        ).exists():
            return True

        return request.method in permissions.SAFE_METHODS
