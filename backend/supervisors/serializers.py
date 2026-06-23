from __future__ import annotations

from typing import Any
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from supervisors.models import SupervisorProfile
from supervisors.services import create_supervisor_with_user, validate_supervisor_uniqueness
from masters.serializers import (
    InstitutionSerializer,
    TrainingSiteSerializer,
    DepartmentSerializer,
    ProgramSerializer,
    SpecialtySerializer,
    DesignationSerializer,
)

User = get_user_model()


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "phone", "is_active", "is_profile_complete"]
        read_only_fields = ["id", "username", "is_profile_complete"]


class SupervisorProfileSerializer(serializers.ModelSerializer):
    user = NestedUserSerializer(read_only=True)

    # Master details fields
    institution_ref_detail = InstitutionSerializer(source="institution_ref", read_only=True)
    training_site_ref_detail = TrainingSiteSerializer(source="training_site_ref", read_only=True)
    department_ref_detail = DepartmentSerializer(source="department_ref", read_only=True)
    program_ref_detail = ProgramSerializer(source="program_ref", read_only=True)
    specialty_ref_detail = SpecialtySerializer(source="specialty_ref", read_only=True)
    designation_ref_detail = DesignationSerializer(source="designation_ref", read_only=True)

    identity_status = serializers.SerializerMethodField()

    class Meta:
        model = SupervisorProfile
        fields = [
            "id",
            "user",
            "designation",
            "qualification",
            "pmdc_number",
            "specialty_name",
            "subspecialty_name",
            "institution_name",
            "department_name",
            "program_name",
            "primary_office_phone",
            "primary_office_phone_normalized",
            "alternate_phone",
            "alternate_phone_normalized",
            "official_email",
            "room_or_office",
            "availability_notes",
            "supervision_status",
            "max_active_residents",
            "can_supervise_thesis",
            "can_supervise_clinical_training",
            "notes",
            "extra_data",
            "is_archived",
            "archived_at",
            "archived_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",

            # Master keys
            "institution_ref",
            "training_site_ref",
            "department_ref",
            "program_ref",
            "specialty_ref",
            "designation_ref",

            # Master details
            "institution_ref_detail",
            "training_site_ref_detail",
            "department_ref_detail",
            "program_ref_detail",
            "specialty_ref_detail",
            "designation_ref_detail",
            "identity_status",
        ]
        read_only_fields = [
            "id",
            "user",
            "primary_office_phone_normalized",
            "alternate_phone_normalized",
            "is_archived",
            "archived_at",
            "archived_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "identity_status",
        ]

    def get_identity_status(self, obj: SupervisorProfile) -> str:
        if (
            obj.training_site_ref_id
            and obj.department_ref_id
            and obj.designation_ref_id
        ):
            return "COMPLETE"
        return "INCOMPLETE"

    def update(self, instance: SupervisorProfile, validated_data: dict[str, Any]) -> SupervisorProfile:
        request = self.context.get("request")
        updated_by = request.user if request else None

        # Check unique constraint changes before saving
        email = validated_data.get("official_email", instance.official_email)
        pmdc = validated_data.get("pmdc_number", instance.pmdc_number)

        try:
            validate_supervisor_uniqueness(
                username=instance.user.username,
                email=email,
                pmdc_number=pmdc,
                exclude_supervisor_id=instance.pk,
            )
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)

        # Write updates to profile instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.updated_by = updated_by
        instance.save()

        # Synchronize User contact details if they are supplied in request body
        user = instance.user
        user_modified = False

        user_full_name = request.data.get("user.full_name") if request else None
        user_phone = request.data.get("user.phone") if request else None
        user_email = request.data.get("user.email") if request else None
        user_is_active = request.data.get("user.is_active") if request else None

        if user_full_name is not None:
            user.full_name = user_full_name
            user_modified = True
        if user_phone is not None:
            user.phone = user_phone
            instance.primary_office_phone = user_phone
            instance.save()
            user_modified = True
        if user_email is not None:
            user.email = user_email
            user_modified = True
        if user_is_active is not None:
            user.is_active = user_is_active
            user_modified = True

        if user_modified:
            user.save()

        return instance


class SupervisorCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=150, write_only=True)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True, write_only=True)
    full_name = serializers.CharField(max_length=255, write_only=True)
    phone = serializers.CharField(max_length=50, write_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = SupervisorProfile
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "phone",
            "password",
            "designation",
            "qualification",
            "pmdc_number",
            "specialty_name",
            "subspecialty_name",
            "institution_name",
            "department_name",
            "program_name",
            "alternate_phone",
            "room_or_office",
            "availability_notes",
            "supervision_status",
            "max_active_residents",
            "can_supervise_thesis",
            "can_supervise_clinical_training",
            "notes",
            "extra_data",

            # Master references required at creation
            "institution_ref",
            "training_site_ref",
            "department_ref",
            "program_ref",
            "specialty_ref",
            "designation_ref",
        ]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        # Required master fields for new supervisor profile setup:
        if not attrs.get("training_site_ref"):
            raise serializers.ValidationError({"training_site_ref": "Hospital is required for new supervisors."})
        if not attrs.get("department_ref"):
            raise serializers.ValidationError({"department_ref": "Department / Discipline is required for new supervisors."})
        if not attrs.get("designation_ref"):
            raise serializers.ValidationError({"designation_ref": "Designation is required for new supervisors."})
        return attrs

    def create(self, validated_data: dict[str, Any]) -> SupervisorProfile:
        user_fields = ["username", "email", "full_name", "phone", "password"]
        user_data = {f: validated_data.pop(f) for f in user_fields if f in validated_data}
        profile_data = validated_data

        request = self.context.get("request")
        created_by = request.user if request else None

        try:
            profile = create_supervisor_with_user(
                user_data=user_data,
                profile_data=profile_data,
                created_by=created_by,
                request=request,
            )
            return profile
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)

    def to_representation(self, instance: SupervisorProfile) -> dict[str, Any]:
        return SupervisorProfileSerializer(instance, context=self.context).data


class DuplicateCheckSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    pmdc_number = serializers.CharField(required=False, allow_null=True, allow_blank=True)
