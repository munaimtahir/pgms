from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from access.models import UserRoleAssignment
from access.serializers import UserRoleAssignmentSerializer
from audit.utils import log_audit


class IsAdminOrRoleManager(permissions.BasePermission):
    """
    Authorized permissions: UTRMC_ADMIN or active assigned UTRMC_ADMIN_ACCESS.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.user_category == "UTRMC_ADMIN":
            return True

        # Check if the user has an active UserRoleAssignment with UTRMC_ADMIN_ACCESS
        return UserRoleAssignment.objects.filter(
            user=user,
            role=UserRoleAssignment.Role.UTRMC_ADMIN_ACCESS,
            is_active=True,
        ).exists()


class UserRoleAssignmentViewSet(viewsets.ModelViewSet):
    queryset = UserRoleAssignment.objects.all().order_by("-assigned_at")
    serializer_class = UserRoleAssignmentSerializer
    permission_classes = [IsAdminOrRoleManager]

    def get_queryset(self):
        queryset = UserRoleAssignment.objects.all().order_by("-assigned_at")
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in {"1", "true", "yes"})

        user_id = self.request.query_params.get("user")
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        role = self.request.query_params.get("role")
        if role:
            queryset = queryset.filter(role=role)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit(
            action="ROLE_ASSIGNMENT_CREATED",
            request=self.request,
            actor=self.request.user,
            target_model="access.UserRoleAssignment",
            target_id=instance.pk,
            after={
                "user": instance.user.pk,
                "role": instance.role,
                "scope_type": instance.scope_type,
                "is_active": instance.is_active,
            },
        )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_is_active = old_instance.is_active

        instance = serializer.save()

        action = "ROLE_ASSIGNMENT_UPDATED"
        if old_is_active != instance.is_active:
            if instance.is_active:
                action = "ROLE_ASSIGNMENT_REACTIVATED"
            else:
                action = "ROLE_ASSIGNMENT_DEACTIVATED"

        log_audit(
            action=action,
            request=self.request,
            actor=self.request.user,
            target_model="access.UserRoleAssignment",
            target_id=instance.pk,
            before={"is_active": old_is_active, "role": old_instance.role},
            after={"is_active": instance.is_active, "role": instance.role},
        )

    def destroy(self, request, *args, **kwargs) -> Response:
        """
        Deactivate role assignment instead of physical deletion.
        """
        instance = self.get_object()
        if not instance.is_active:
            return Response(
                {"detail": "Role assignment is already deactivated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        before = {"is_active": True}
        instance.is_active = False
        instance.save()

        log_audit(
            action="ROLE_ASSIGNMENT_DEACTIVATED",
            request=request,
            actor=request.user,
            target_model="access.UserRoleAssignment",
            target_id=instance.pk,
            before=before,
            after={"is_active": False},
        )

        return Response(
            {"message": "Role assignment deactivated successfully."},
            status=status.HTTP_200_OK,
        )
