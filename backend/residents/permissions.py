from __future__ import annotations

from rest_framework import permissions


class ResidentDirectoryPermission(permissions.BasePermission):
    """
    Permission matrix for Resident Directory:
    - UTRMC_ADMIN: Full access (create, list, retrieve, update, archive/unarchive).
    - SUPPORT_STAFF: Read-only directory access + Create/Update. Cannot delete/archive.
    - RESIDENT: Can only retrieve/update their own profile. List is blocked.
    - SUPERVISOR: Blocked from accessing the resident directory completely in Brick 2.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.user_category == "UTRMC_ADMIN":
            return True

        if user.user_category == "SUPPORT_STAFF":
            # Allowed to view list, detail, create, edit. Cannot delete.
            return request.method in ["GET", "POST", "PUT", "PATCH", "HEAD", "OPTIONS"]

        if user.user_category == "RESIDENT":
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
            return True
        if user.user_category == "RESIDENT":
            # Only allow residents to view their own profile
            return obj.user == user
        return False
