from __future__ import annotations

from django.db.models import Q
from rest_framework import permissions

from access.models import UserRoleAssignment


def get_scoped_queryset(user, queryset):
    """
    Applies active UserRoleAssignment scoping filters to a queryset.
    """
    if not user or not user.is_authenticated:
        return queryset.none()

    if user.user_category == "UTRMC_ADMIN":
        return queryset

    # Check for active UTRMC_ADMIN_ACCESS role assignment
    if UserRoleAssignment.objects.filter(
        user=user,
        role=UserRoleAssignment.Role.UTRMC_ADMIN_ACCESS,
        is_active=True,
    ).exists():
        return queryset

    # Fetch active assignments for the user
    assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
    if not assignments.exists():
        # Fallback for residents/supervisors to see their own profile
        if user.user_category in {"RESIDENT", "SUPERVISOR"}:
            return queryset
        return queryset.none()

    scope_query = Q()
    has_global = False

    for a in assignments:
        if a.scope_type == UserRoleAssignment.ScopeType.GLOBAL:
            has_global = True
            break
        elif a.scope_type == UserRoleAssignment.ScopeType.INSTITUTION and a.institution_id:
            scope_query |= Q(institution_ref_id=a.institution_id)
        elif a.scope_type == UserRoleAssignment.ScopeType.TRAINING_SITE and a.training_site_id:
            scope_query |= Q(training_site_ref_id=a.training_site_id)
        elif a.scope_type == UserRoleAssignment.ScopeType.DEPARTMENT and a.department_id:
            scope_query |= Q(department_ref_id=a.department_id)
        elif a.scope_type == UserRoleAssignment.ScopeType.PROGRAM and a.program_id:
            scope_query |= Q(program_ref_id=a.program_id)
        elif a.scope_type == UserRoleAssignment.ScopeType.SPECIALTY and a.specialty_id:
            scope_query |= Q(specialty_ref_id=a.specialty_id)

    if has_global:
        return queryset

    if not scope_query:
        return queryset.none()

    return queryset.filter(scope_query)


def check_write_scope_permission(user, obj_data: dict) -> bool:
    """
    Validates if a mutation payload's target masters lie within the user's active scopes.
    obj_data is a dictionary of fields/keys, or an object instance.
    """
    if not user or not user.is_authenticated:
        return False

    if user.user_category == "UTRMC_ADMIN":
        return True

    # Admin access has bypass
    if UserRoleAssignment.objects.filter(
        user=user,
        role=UserRoleAssignment.Role.UTRMC_ADMIN_ACCESS,
        is_active=True,
    ).exists():
        return True

    assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
    
    # Check if they have mutating roles at all
    mutating_roles = {
        UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS,
        UserRoleAssignment.Role.DATA_ENTRY_ACCESS,
        UserRoleAssignment.Role.DEPARTMENT_ADMIN_ACCESS,
    }
    
    active_mutating = assignments.filter(role__in=mutating_roles)
    if not active_mutating.exists():
        return False

    # Extract target values
    def get_val(key):
        val = obj_data.get(key)
        if val is None:
            return None
        # Handle model instances
        if hasattr(val, "id"):
            return val.id
        return val

    inst_id = get_val("institution_ref")
    site_id = get_val("training_site_ref")
    dept_id = get_val("department_ref")
    prog_id = get_val("program_ref")
    spec_id = get_val("specialty_ref")

    for a in active_mutating:
        if a.scope_type == UserRoleAssignment.ScopeType.GLOBAL:
            return True
        elif a.scope_type == UserRoleAssignment.ScopeType.INSTITUTION and inst_id and a.institution_id == inst_id:
            return True
        elif a.scope_type == UserRoleAssignment.ScopeType.TRAINING_SITE and site_id and a.training_site_id == site_id:
            return True
        elif a.scope_type == UserRoleAssignment.ScopeType.DEPARTMENT and dept_id and a.department_id == dept_id:
            return True
        elif a.scope_type == UserRoleAssignment.ScopeType.PROGRAM and prog_id and a.program_id == prog_id:
            return True
        elif a.scope_type == UserRoleAssignment.ScopeType.SPECIALTY and spec_id and a.specialty_id == spec_id:
            return True

    return False


class ScopedAccessControlPermission(permissions.BasePermission):
    """
    DRF permission checker executing view/object restrictions.
    - UTRMC_ADMIN / UTRMC_ADMIN_ACCESS role: Full access.
    - AUDITOR_ACCESS: Read-only access within their scope.
    - Other active roles: Can perform mutations within scope.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.user_category == "UTRMC_ADMIN":
            return True

        # Block cross-directory access when no active role assignments exist
        view_name = view.__class__.__name__
        if user.user_category == "SUPERVISOR" and view_name == "ResidentViewSet":
            if not UserRoleAssignment.objects.filter(user=user, is_active=True).exists():
                return False

        if user.user_category == "RESIDENT" and view_name == "SupervisorViewSet":
            if not UserRoleAssignment.objects.filter(user=user, is_active=True).exists():
                return False

        # Residents and supervisors cannot list profiles
        action_name = getattr(view, "action", None)
        if action_name == "list" and user.user_category in {"RESIDENT", "SUPERVISOR"}:
            if not UserRoleAssignment.objects.filter(user=user, is_active=True).exists():
                return False

        # Allow all authenticated read-only requests at list/detail permission level
        # Scoped queryset filters will restrict list items visibility
        if request.method in permissions.SAFE_METHODS:
            return True

        # Check mutating access
        # RESIDENT / SUPERVISOR own update allowed
        if user.user_category in {"RESIDENT", "SUPERVISOR"}:
            return True

        # SUPPORT_STAFF / other roles require a mutating role
        assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
        mutating_roles = {
            UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS,
            UserRoleAssignment.Role.DATA_ENTRY_ACCESS,
            UserRoleAssignment.Role.DEPARTMENT_ADMIN_ACCESS,
        }
        if view.__class__.__name__ == "SupervisorViewSet":
            mutating_roles.discard(UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS)
        
        return assignments.filter(role__in=mutating_roles).exists()

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if user.user_category == "UTRMC_ADMIN":
            return True

        # Own profile check
        if user.user_category in {"RESIDENT", "SUPERVISOR"}:
            if hasattr(obj, "user"):
                is_own = obj.user == user
                if is_own:
                    # Non-admins can read own profile. Residents/Supervisors can patch own profile.
                    return True
            return False

        # Check scope limits for read operation
        if request.method in permissions.SAFE_METHODS:
            # Check if this object is within user's read scope
            return check_write_scope_permission(
                user,
                {
                    "institution_ref": obj.institution_ref_id,
                    "training_site_ref": obj.training_site_ref_id,
                    "department_ref": obj.department_ref_id,
                    "program_ref": obj.program_ref_id,
                    "specialty_ref": obj.specialty_ref_id,
                }
            )

        # Mutate operations check
        return check_write_scope_permission(
            user,
            {
                "institution_ref": obj.institution_ref_id,
                "training_site_ref": obj.training_site_ref_id,
                "department_ref": obj.department_ref_id,
                "program_ref": obj.program_ref_id,
                "specialty_ref": obj.specialty_ref_id,
            }
        )
