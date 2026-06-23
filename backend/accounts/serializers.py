from __future__ import annotations

from typing import Any
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    allowed_next_route = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "phone",
            "user_category",
            "is_active",
            "is_profile_complete",
            "must_change_password",
            "extra_data",
            "created_at",
            "updated_at",
            "allowed_next_route",
        ]
        read_only_fields = [
            "id",
            "username",
            "is_profile_complete",
            "must_change_password",
            "created_at",
            "updated_at",
            "allowed_next_route",
        ]

    def get_allowed_next_route(self, obj) -> str:
        if obj.must_change_password:
            return "/change-password"
        if not obj.is_profile_complete:
            return "/complete-profile"
        if obj.user_category == "UTRMC_ADMIN":
            return "/users"
        return "/account"


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "phone",
            "user_category",
            "password",
            "is_profile_complete",
            "must_change_password",
            "extra_data",
        ]
        extra_kwargs = {
            "email": {"required": False, "allow_null": True},
        }

    def create(self, validated_data: dict[str, Any]) -> User:
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
            user.must_change_password = True
        else:
            # If no password is provided, set a temporary password matching the username
            user.set_password(validated_data["username"])
            user.must_change_password = True
            
        user.save()
        return user


class CompleteProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(required=True, min_length=2)
    phone = serializers.CharField(required=True, min_length=5)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ["full_name", "phone", "email"]

    def validate_email(self, value: str) -> str:
        value = value.strip().lower()
        # Verify email uniqueness excluding current user
        user = self.context["request"].user
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def update(self, instance: User, validated_data: dict[str, Any]) -> User:
        instance.full_name = validated_data.get("full_name", instance.full_name)
        instance.phone = validated_data.get("phone", instance.phone)
        instance.email = validated_data.get("email", instance.email)
        instance.is_profile_complete = True
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=6)

    def validate_old_password(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self) -> User:
        user = self.context["request"].user
        new_password = self.validated_data["new_password"]
        user.set_password(new_password)
        user.must_change_password = False
        user.save()
        return user


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=True, write_only=True, min_length=6)

    def save(self, user: User) -> User:
        new_password = self.validated_data["new_password"]
        user.set_password(new_password)
        user.must_change_password = True
        user.save()
        return user
