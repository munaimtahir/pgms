from __future__ import annotations

from typing import Any
from django.contrib.auth import get_user_model
from rest_framework import serializers

from masters.models import (
    AcademicSession,
    Department,
    Designation,
    Institution,
    Program,
    Specialty,
    TrainingSite,
)

User = get_user_model()


class AuditUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "full_name"]


class InstitutionSerializer(serializers.ModelSerializer):
    created_by_detail = AuditUserSerializer(source="created_by", read_only=True)
    updated_by_detail = AuditUserSerializer(source="updated_by", read_only=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = Institution
        fields = "__all__"
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at"]

    def create(self, validated_data: dict[str, Any]) -> Institution:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["created_by"] = user
        return super().create(validated_data)

    def update(self, instance: Institution, validated_data: dict[str, Any]) -> Institution:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["updated_by"] = user
        return super().update(instance, validated_data)


class TrainingSiteSerializer(serializers.ModelSerializer):
    created_by_detail = AuditUserSerializer(source="created_by", read_only=True)
    updated_by_detail = AuditUserSerializer(source="updated_by", read_only=True)
    institution_detail = InstitutionSerializer(source="institution", read_only=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = TrainingSite
        fields = "__all__"
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at"]

    def create(self, validated_data: dict[str, Any]) -> TrainingSite:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["created_by"] = user
        return super().create(validated_data)

    def update(self, instance: TrainingSite, validated_data: dict[str, Any]) -> TrainingSite:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["updated_by"] = user
        return super().update(instance, validated_data)


class DepartmentSerializer(serializers.ModelSerializer):
    created_by_detail = AuditUserSerializer(source="created_by", read_only=True)
    updated_by_detail = AuditUserSerializer(source="updated_by", read_only=True)
    training_site_detail = TrainingSiteSerializer(source="training_site", read_only=True)
    is_active = serializers.BooleanField(default=True)
    is_clinical = serializers.BooleanField(default=True)

    class Meta:
        model = Department
        fields = "__all__"
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at"]

    def create(self, validated_data: dict[str, Any]) -> Department:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["created_by"] = user
        return super().create(validated_data)

    def update(self, instance: Department, validated_data: dict[str, Any]) -> Department:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["updated_by"] = user
        return super().update(instance, validated_data)


class ProgramSerializer(serializers.ModelSerializer):
    created_by_detail = AuditUserSerializer(source="created_by", read_only=True)
    updated_by_detail = AuditUserSerializer(source="updated_by", read_only=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = Program
        fields = "__all__"
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at"]

    def create(self, validated_data: dict[str, Any]) -> Program:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["created_by"] = user
        return super().create(validated_data)

    def update(self, instance: Program, validated_data: dict[str, Any]) -> Program:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["updated_by"] = user
        return super().update(instance, validated_data)


class SpecialtySerializer(serializers.ModelSerializer):
    created_by_detail = AuditUserSerializer(source="created_by", read_only=True)
    updated_by_detail = AuditUserSerializer(source="updated_by", read_only=True)
    program_detail = ProgramSerializer(source="program", read_only=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = Specialty
        fields = "__all__"
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at"]

    def create(self, validated_data: dict[str, Any]) -> Specialty:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["created_by"] = user
        return super().create(validated_data)

    def update(self, instance: Specialty, validated_data: dict[str, Any]) -> Specialty:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["updated_by"] = user
        return super().update(instance, validated_data)


class DesignationSerializer(serializers.ModelSerializer):
    created_by_detail = AuditUserSerializer(source="created_by", read_only=True)
    updated_by_detail = AuditUserSerializer(source="updated_by", read_only=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = Designation
        fields = "__all__"
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at"]

    def create(self, validated_data: dict[str, Any]) -> Designation:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["created_by"] = user
        return super().create(validated_data)

    def update(self, instance: Designation, validated_data: dict[str, Any]) -> Designation:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["updated_by"] = user
        return super().update(instance, validated_data)


class AcademicSessionSerializer(serializers.ModelSerializer):
    created_by_detail = AuditUserSerializer(source="created_by", read_only=True)
    updated_by_detail = AuditUserSerializer(source="updated_by", read_only=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = AcademicSession
        fields = "__all__"
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at"]

    def create(self, validated_data: dict[str, Any]) -> AcademicSession:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["created_by"] = user
        return super().create(validated_data)

    def update(self, instance: AcademicSession, validated_data: dict[str, Any]) -> AcademicSession:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["updated_by"] = user
        return super().update(instance, validated_data)
