from __future__ import annotations

from typing import Any
from django.contrib.auth import get_user_model
from rest_framework import serializers

from access.models import UserRoleAssignment
from masters.serializers import (
    DepartmentSerializer,
    InstitutionSerializer,
    ProgramSerializer,
    SpecialtySerializer,
    TrainingSiteSerializer,
)

User = get_user_model()


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "phone", "user_category"]


class UserRoleAssignmentSerializer(serializers.ModelSerializer):
    user_detail = NestedUserSerializer(source="user", read_only=True)
    assigned_by_detail = NestedUserSerializer(source="assigned_by", read_only=True)

    institution_detail = InstitutionSerializer(source="institution", read_only=True)
    training_site_detail = TrainingSiteSerializer(source="training_site", read_only=True)
    department_detail = DepartmentSerializer(source="department", read_only=True)
    program_detail = ProgramSerializer(source="program", read_only=True)
    specialty_detail = SpecialtySerializer(source="specialty", read_only=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = UserRoleAssignment
        fields = "__all__"
        read_only_fields = ["id", "assigned_by", "assigned_at", "created_at", "updated_at"]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        # Enforce validation rules on creation/updates
        # Since model's clean is not automatically called in REST serializers, we call it manually
        instance = UserRoleAssignment(**attrs)
        # Handle field checks if partial updates are done
        if self.instance:
            for field in self.Meta.fields:
                if field not in attrs and hasattr(self.instance, field):
                    setattr(instance, field, getattr(self.instance, field))
                    
        try:
            instance.clean()
        except Exception as e:
            raise serializers.ValidationError(detail=str(e))
            
        return attrs

    def create(self, validated_data: dict[str, Any]) -> UserRoleAssignment:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["assigned_by"] = user
        return super().create(validated_data)

    def update(self, instance: UserRoleAssignment, validated_data: dict[str, Any]) -> UserRoleAssignment:
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["assigned_by"] = user
        return super().update(instance, validated_data)
