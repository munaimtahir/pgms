from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import EnforceUserStatusPermission
from audit.utils import log_audit
from residents.models import ResidentProfile
from residents.permissions import ResidentDirectoryPermission
from residents.serializers import (
    DuplicateCheckSerializer,
    ResidentCreateSerializer,
    ResidentProfileSerializer,
)

User = get_user_model()


class ResidentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Resident Profiles.
    - UTRMC_ADMIN: Full access.
    - SUPPORT_STAFF: View, create, update. Cannot delete/archive.
    - RESIDENT: View/update own profile details only.
    - SUPERVISOR: Blocked by default.
    """

    queryset = ResidentProfile.objects.all().order_by("-created_at")
    permission_classes = [ResidentDirectoryPermission, EnforceUserStatusPermission]

    def get_serializer_class(self):
        if self.action == "create":
            return ResidentCreateSerializer
        return ResidentProfileSerializer

    def get_queryset(self):
        queryset = ResidentProfile.objects.all().order_by("-created_at")
        user = self.request.user

        # 1. Access Control Filter
        if user.user_category == "RESIDENT":
            queryset = queryset.filter(user=user)
        elif user.user_category == "SUPERVISOR":
            queryset = queryset.none()

        # 2. Archive Filtering
        is_archived = self.request.query_params.get("is_archived")
        if self.action == "unarchive":
            # Allow retrieving the archived profile to perform unarchive
            pass
        elif is_archived is not None:
            if user.user_category in {"UTRMC_ADMIN", "SUPPORT_STAFF"}:
                queryset = queryset.filter(is_archived=is_archived.lower() in {"1", "true", "yes"})
            else:
                queryset = queryset.filter(is_archived=False)
        else:
            queryset = queryset.filter(is_archived=False)

        # 3. Dynamic Search and Filters
        current_status = self.request.query_params.get("current_status")
        if current_status:
            queryset = queryset.filter(current_status=current_status)

        program_name = self.request.query_params.get("program_name")
        if program_name:
            queryset = queryset.filter(program_name__icontains=program_name)

        specialty_name = self.request.query_params.get("specialty_name")
        if specialty_name:
            queryset = queryset.filter(specialty_name__icontains=specialty_name)

        institution_name = self.request.query_params.get("institution_name")
        if institution_name:
            queryset = queryset.filter(institution_name__icontains=institution_name)

        department_name = self.request.query_params.get("department_name")
        if department_name:
            queryset = queryset.filter(department_name__icontains=department_name)

        training_year = self.request.query_params.get("training_year")
        if training_year:
            queryset = queryset.filter(training_year=training_year)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                models.Q(user__full_name__icontains=search)
                | models.Q(user__username__icontains=search)
                | models.Q(cnic_or_passport__icontains=search)
                | models.Q(pmdc_number__icontains=search)
            )

        return queryset

    def perform_update(self, serializer):
        instance = self.get_object()
        
        # Serialize fields before change
        from django.forms import model_to_dict
        before = model_to_dict(instance)
        before["user"] = instance.user.pk

        profile = serializer.save()

        after = model_to_dict(profile)
        after["user"] = profile.user.pk

        log_audit(
            action="RESIDENT_UPDATED",
            request=self.request,
            actor=self.request.user,
            target_model="residents.ResidentProfile",
            target_id=profile.pk,
            before=before,
            after=after,
        )

    def destroy(self, request, *args, **kwargs) -> Response:
        """
        Soft delete (archive) the resident profile and deactivate user.
        """
        if request.user.user_category != "UTRMC_ADMIN":
            return Response(
                {"detail": "Only UTRMC administrators can archive resident records."},
                status=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        before = {"is_archived": instance.is_archived, "user_is_active": instance.user.is_active}

        # 1. Update Profile is_archived
        instance.is_archived = True
        instance.archived_at = timezone.now()
        instance.archived_by = request.user
        instance.save()

        # 2. Deactivate Linked User Account
        user = instance.user
        user.is_active = False
        user.save()

        log_audit(
            action="RESIDENT_ARCHIVED",
            request=request,
            actor=request.user,
            target_model="residents.ResidentProfile",
            target_id=instance.pk,
            before=before,
            after={"is_archived": True, "archived_at": str(instance.archived_at), "user_is_active": False},
        )

        return Response(
            {"message": "Resident archived successfully and user account disabled."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="unarchive")
    def unarchive(self, request, pk=None) -> Response:
        """
        Restore (unarchive) the resident profile and re-enable user.
        """
        if request.user.user_category != "UTRMC_ADMIN":
            return Response(
                {"detail": "Only UTRMC administrators can unarchive resident records."},
                status=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        before = {"is_archived": instance.is_archived, "user_is_active": instance.user.is_active}

        # 1. Reset Archive flags
        instance.is_archived = False
        instance.archived_at = None
        instance.archived_by = None
        instance.save()

        # 2. Re-enable User Account
        user = instance.user
        user.is_active = True
        user.save()

        log_audit(
            action="RESIDENT_UNARCHIVED",
            request=request,
            actor=request.user,
            target_model="residents.ResidentProfile",
            target_id=instance.pk,
            before=before,
            after={"is_archived": False, "user_is_active": True},
        )

        return Response(
            {"message": "Resident unarchived successfully and user account activated."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="check-duplicates")
    def check_duplicates(self, request) -> Response:
        """
        Validates unique constraints (username, email, CNIC, PMDC) for warning presentation.
        """
        serializer = DuplicateCheckSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data["username"]
            cnic = serializer.validated_data["cnic_or_passport"]
            email = serializer.validated_data.get("email")
            pmdc = serializer.validated_data.get("pmdc_number")

            duplicates = {}
            if User.objects.filter(username__iexact=username).exists():
                duplicates["username"] = "Username already exists."
            if cnic and ResidentProfile.objects.filter(cnic_or_passport__iexact=cnic).exists():
                duplicates["cnic_or_passport"] = "CNIC or Passport already exists."
            if email and User.objects.filter(email__iexact=email).exists():
                duplicates["email"] = "Email already exists."
            if pmdc and ResidentProfile.objects.filter(pmdc_number__iexact=pmdc).exists():
                duplicates["pmdc_number"] = "PMDC already exists."

            log_audit(
                action="RESIDENT_DUPLICATE_CHECKED",
                request=request,
                actor=request.user,
                metadata={
                    "checked": serializer.validated_data,
                    "duplicates_found": list(duplicates.keys()),
                },
            )

            return Response(
                {"has_duplicates": len(duplicates) > 0, "duplicates": duplicates},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
