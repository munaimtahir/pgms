from __future__ import annotations

from typing import Any
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.serializers import UserSerializer
from residents.models import ResidentProfile
from residents.services import create_resident_with_user, validate_resident_uniqueness
from masters.serializers import (
    InstitutionSerializer,
    TrainingSiteSerializer,
    DepartmentSerializer,
    ProgramSerializer,
    SpecialtySerializer,
    AcademicSessionSerializer,
)

User = get_user_model()


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "phone", "is_active", "is_profile_complete"]
        read_only_fields = ["id", "username", "is_profile_complete"]


class ResidentProfileSerializer(serializers.ModelSerializer):
    user = NestedUserSerializer(read_only=True)

    # Master details fields
    institution_ref_detail = InstitutionSerializer(source="institution_ref", read_only=True)
    training_site_ref_detail = TrainingSiteSerializer(source="training_site_ref", read_only=True)
    department_ref_detail = DepartmentSerializer(source="department_ref", read_only=True)
    program_ref_detail = ProgramSerializer(source="program_ref", read_only=True)
    specialty_ref_detail = SpecialtySerializer(source="specialty_ref", read_only=True)
    academic_session_ref_detail = AcademicSessionSerializer(source="academic_session_ref", read_only=True)
    
    identity_status = serializers.SerializerMethodField()

    class Meta:
        model = ResidentProfile
        fields = [
            "id",
            "user",
            "father_name",
            "cnic_or_passport",
            "gender",
            "date_of_birth",
            "primary_phone",
            "primary_phone_normalized",
            "whatsapp_number",
            "whatsapp_number_normalized",
            "alternate_email",
            "address",
            "program_name",
            "specialty_name",
            "training_level",
            "training_year",
            "session_year",
            "date_of_joining",
            "expected_completion_date",
            "institution_name",
            "department_name",
            "current_status",
            "pmdc_number",
            "university_registration_number",
            "employee_or_training_id",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relation",
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
            "academic_session_ref",

            # Master detail representations
            "institution_ref_detail",
            "training_site_ref_detail",
            "department_ref_detail",
            "program_ref_detail",
            "specialty_ref_detail",
            "academic_session_ref_detail",
            "identity_status",
        ]
        read_only_fields = [
            "id",
            "user",
            "primary_phone_normalized",
            "whatsapp_number_normalized",
            "is_archived",
            "archived_at",
            "archived_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "identity_status",
        ]

    def get_identity_status(self, obj: ResidentProfile) -> str:
        if (
            obj.training_site_ref_id
            and obj.department_ref_id
            and obj.program_ref_id
            and obj.academic_session_ref_id
        ):
            return "COMPLETE"
        return "INCOMPLETE"

    def update(self, instance: ResidentProfile, validated_data: dict[str, Any]) -> ResidentProfile:
        request = self.context.get("request")
        updated_by = request.user if request else None

        # Check unique constraint changes before saving
        cnic = validated_data.get("cnic_or_passport", instance.cnic_or_passport)
        pmdc = validated_data.get("pmdc_number", instance.pmdc_number)
        
        try:
            validate_resident_uniqueness(
                username=instance.user.username,
                cnic_or_passport=cnic,
                email=instance.user.email,
                pmdc_number=pmdc,
                exclude_resident_id=instance.pk,
            )
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)

        # Write updates to profile instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.updated_by = updated_by
        instance.save()

        # Update User object fields if necessary
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
            instance.primary_phone = user_phone
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


class ResidentCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=150, write_only=True)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True, write_only=True)
    full_name = serializers.CharField(max_length=255, write_only=True)
    phone = serializers.CharField(max_length=50, write_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = ResidentProfile
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "phone",
            "password",
            "father_name",
            "cnic_or_passport",
            "gender",
            "date_of_birth",
            "whatsapp_number",
            "alternate_email",
            "address",
            "program_name",
            "specialty_name",
            "training_level",
            "training_year",
            "session_year",
            "date_of_joining",
            "expected_completion_date",
            "institution_name",
            "department_name",
            "current_status",
            "pmdc_number",
            "university_registration_number",
            "employee_or_training_id",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relation",
            "notes",
            "extra_data",

            # Master references required at creation
            "institution_ref",
            "training_site_ref",
            "department_ref",
            "program_ref",
            "specialty_ref",
            "academic_session_ref",
        ]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        # Required master fields for new resident profile setup:
        if not attrs.get("training_site_ref"):
            raise serializers.ValidationError({"training_site_ref": "Hospital is required for new residents."})
        if not attrs.get("department_ref"):
            raise serializers.ValidationError({"department_ref": "Department / Discipline is required for new residents."})
        if not attrs.get("program_ref"):
            raise serializers.ValidationError({"program_ref": "Program is required for new residents."})
        if not attrs.get("academic_session_ref"):
            raise serializers.ValidationError({"academic_session_ref": "Session is required for new residents."})
        return attrs

    def create(self, validated_data: dict[str, Any]) -> ResidentProfile:
        user_fields = ["username", "email", "full_name", "phone", "password"]
        user_data = {f: validated_data.pop(f) for f in user_fields if f in validated_data}
        profile_data = validated_data

        request = self.context.get("request")
        created_by = request.user if request else None

        try:
            profile = create_resident_with_user(
                user_data=user_data,
                profile_data=profile_data,
                created_by=created_by,
                request=request,
            )
            return profile
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)

    def to_representation(self, instance: ResidentProfile) -> dict[str, Any]:
        return ResidentProfileSerializer(instance, context=self.context).data


class DuplicateCheckSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    cnic_or_passport = serializers.CharField(required=True)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    pmdc_number = serializers.CharField(required=False, allow_null=True, allow_blank=True)
