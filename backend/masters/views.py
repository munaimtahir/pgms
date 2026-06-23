from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from audit.utils import log_audit
from masters.models import (
    AcademicSession,
    Department,
    Designation,
    Institution,
    Program,
    Specialty,
    TrainingSite,
)
from masters.permissions import IsAdminOrReadOnly
from masters.serializers import (
    AcademicSessionSerializer,
    DepartmentSerializer,
    DesignationSerializer,
    InstitutionSerializer,
    ProgramSerializer,
    SpecialtySerializer,
    TrainingSiteSerializer,
)


class BaseMasterViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = self.queryset
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in {"1", "true", "yes"})
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit(
            action="MASTER_CREATED",
            request=self.request,
            actor=self.request.user,
            target_model=f"masters.{self.model_name}",
            target_id=instance.pk,
            after={"name": instance.name, "code": instance.code, "is_active": instance.is_active},
        )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_is_active = old_instance.is_active

        instance = serializer.save()
        
        # Log reactivation / deactivation audit if state changed
        action = "MASTER_UPDATED"
        if old_is_active != instance.is_active:
            if instance.is_active:
                action = "MASTER_REACTIVATED"
            else:
                action = "MASTER_DEACTIVATED"

        log_audit(
            action=action,
            request=self.request,
            actor=self.request.user,
            target_model=f"masters.{self.model_name}",
            target_id=instance.pk,
            before={"is_active": old_is_active, "name": old_instance.name},
            after={"is_active": instance.is_active, "name": instance.name},
        )

    def destroy(self, request, *args, **kwargs) -> Response:
        """
        Soft delete deactivates master records instead of database purging.
        """
        instance = self.get_object()
        if not instance.is_active:
            return Response(
                {"detail": "Master record is already deactivated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        before = {"is_active": True}
        instance.is_active = False
        instance.save()

        log_audit(
            action="MASTER_DEACTIVATED",
            request=request,
            actor=request.user,
            target_model=f"masters.{self.model_name}",
            target_id=instance.pk,
            before=before,
            after={"is_active": False},
        )

        return Response(
            {"message": "Master record deactivated successfully."},
            status=status.HTTP_200_OK,
        )


class InstitutionViewSet(BaseMasterViewSet):
    queryset = Institution.objects.all().order_by("sort_order", "name")
    serializer_class = InstitutionSerializer
    model_name = "Institution"


class TrainingSiteViewSet(BaseMasterViewSet):
    queryset = TrainingSite.objects.all().order_by("sort_order", "name")
    serializer_class = TrainingSiteSerializer
    model_name = "TrainingSite"

    def get_queryset(self):
        queryset = super().get_queryset()
        institution = self.request.query_params.get("institution")
        if institution:
            queryset = queryset.filter(institution_id=institution)
        return queryset


class DepartmentViewSet(BaseMasterViewSet):
    queryset = Department.objects.all().order_by("sort_order", "name")
    serializer_class = DepartmentSerializer
    model_name = "Department"

    def get_queryset(self):
        queryset = super().get_queryset()
        training_site = self.request.query_params.get("training_site")
        if training_site:
            queryset = queryset.filter(training_site_id=training_site)
        return queryset


class ProgramViewSet(BaseMasterViewSet):
    queryset = Program.objects.all().order_by("sort_order", "name")
    serializer_class = ProgramSerializer
    model_name = "Program"


class SpecialtyViewSet(BaseMasterViewSet):
    queryset = Specialty.objects.all().order_by("sort_order", "name")
    serializer_class = SpecialtySerializer
    model_name = "Specialty"

    def get_queryset(self):
        queryset = super().get_queryset()
        program = self.request.query_params.get("program")
        if program:
            queryset = queryset.filter(program_id=program)
        return queryset


class DesignationViewSet(BaseMasterViewSet):
    queryset = Designation.objects.all().order_by("sort_order", "name")
    serializer_class = DesignationSerializer
    model_name = "Designation"


class AcademicSessionViewSet(BaseMasterViewSet):
    queryset = AcademicSession.objects.all().order_by("sort_order", "name")
    serializer_class = AcademicSessionSerializer
    model_name = "AcademicSession"
