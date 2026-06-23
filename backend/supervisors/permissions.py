from __future__ import annotations

from rest_framework import permissions


class SupervisorDirectoryPermission(permissions.BasePermission):
    """
    Permission matrix for Supervisor Directory:
    - UTRMC_ADMIN: Full access.
    - SUPPORT_STAFF: Read-only directory access. Cannot create, edit, or archive.
    - SUPERVISOR: Can only retrieve/update their own profile. List is blocked.
    - RESIDENT: Blocked completely from accessing the supervisor directory in Brick 3.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.user_category == "UTRMC_ADMIN":
            return True

        if user.user_category == "SUPPORT_STAFF":
            # Read-only access: list or detail retrieve
            return request.method in permissions.SAFE_METHODS

        if user.user_category == "SUPERVISOR":
            # List or creation requests blocked
            if view.action in ["list", "create"]:
                return False
            # Detail GET / PATCH operations allowed, object permissions will enforce matching IDs
            return request.method in ["GET", "PATCH", "PUT", "HEAD", "OPTIONS"]

        return False

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if user.user_category == "UTRMC_ADMIN":
            return True
        if user.user_category == "SUPPORT_STAFF":
            # Read-only detail view
            return request.method in permissions.SAFE_METHODS
        if user.user_category == "SUPERVISOR":
            # Only allow supervisors to view and edit their own profile
            return obj.user == user
        return False
