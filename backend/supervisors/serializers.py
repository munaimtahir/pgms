from __future__ import annotations

from typing import Any
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from supervisors.models import SupervisorProfile
from supervisors.services import create_supervisor_with_user, validate_supervisor_uniqueness

User = get_user_model()


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "phone", "is_active", "is_profile_complete"]
        read_only_fields = ["id", "username", "is_profile_complete"]


class SupervisorProfileSerializer(serializers.ModelSerializer):
    user = NestedUserSerializer(read_only=True)

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
        ]

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
            instance.official_email = user_email
            instance.save()
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
        ]

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
