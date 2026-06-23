from __future__ import annotations

from typing import Any
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction

from audit.utils import log_audit
from supervisors.models import SupervisorProfile

User = get_user_model()


def validate_supervisor_uniqueness(
    username: str,
    email: str | None = None,
    pmdc_number: str | None = None,
    exclude_supervisor_id: int | None = None,
) -> None:
    """
    Validates that username, email, and PMDC are unique across User and SupervisorProfile.
    """
    errors: dict[str, list[str]] = {}

    # 1. Check Username Uniqueness
    user_qs = User.objects.filter(username__iexact=username)
    if exclude_supervisor_id:
        profile = SupervisorProfile.objects.filter(pk=exclude_supervisor_id).first()
        if profile:
            user_qs = user_qs.exclude(pk=profile.user.pk)
    if user_qs.exists():
        errors["username"] = ["A user with that username already exists."]

    # 2. Check Email Uniqueness (Checking user email and official_email)
    if email and email.strip():
        email_clean = email.strip().lower()
        user_qs = User.objects.filter(email__iexact=email_clean)
        profile_qs = SupervisorProfile.objects.filter(official_email__iexact=email_clean)
        
        if exclude_supervisor_id:
            profile = SupervisorProfile.objects.filter(pk=exclude_supervisor_id).first()
            if profile:
                user_qs = user_qs.exclude(pk=profile.user.pk)
                profile_qs = profile_qs.exclude(pk=exclude_supervisor_id)
                
        if user_qs.exists() or profile_qs.exists():
            errors["email"] = ["A user or supervisor with that email already exists."]

    # 3. Check PMDC Uniqueness
    if pmdc_number and pmdc_number.strip():
        pmdc_clean = pmdc_number.strip()
        profile_qs = SupervisorProfile.objects.filter(pmdc_number__iexact=pmdc_clean)
        if exclude_supervisor_id:
            profile_qs = profile_qs.exclude(pk=exclude_supervisor_id)
        if profile_qs.exists():
            errors["pmdc_number"] = ["A supervisor with this PMDC number already exists."]

    if errors:
        raise ValidationError(errors)


def create_supervisor_with_user(
    user_data: dict[str, Any],
    profile_data: dict[str, Any],
    created_by: Any = None,
    request: Any = None,
) -> SupervisorProfile:
    """
    Atomic transaction-safe service to create a User account (category SUPERVISOR) 
    and a linked SupervisorProfile.
    """
    username = user_data.get("username", "").strip()
    email = user_data.get("email") or profile_data.get("official_email")
    if email:
        email = email.strip()
    pmdc = profile_data.get("pmdc_number")
    if pmdc:
        pmdc = pmdc.strip()

    # Pre-validation for uniqueness
    validate_supervisor_uniqueness(
        username=username,
        email=email,
        pmdc_number=pmdc,
    )

    # Sync User profile completion criteria fields
    user_full_name = user_data.get("full_name") or profile_data.get("full_name") or ""
    user_phone = user_data.get("phone") or profile_data.get("primary_office_phone") or ""
    user_email = email or ""

    is_complete = bool(user_full_name and user_phone and user_email)

    with transaction.atomic():
        # 1. Create User
        user = User(
            username=username,
            email=user_email or None,
            full_name=user_full_name,
            phone=user_phone,
            user_category="SUPERVISOR",
            must_change_password=True,
            is_profile_complete=is_complete,
            extra_data=user_data.get("extra_data", {}),
        )
        password = user_data.get("password")
        if password:
            user.set_password(password)
        else:
            # Set temporary password matching username
            user.set_password(username)
        user.save()

        # 2. Create SupervisorProfile
        profile = SupervisorProfile(
            user=user,
            designation=profile_data.get("designation", ""),
            qualification=profile_data.get("qualification", ""),
            pmdc_number=pmdc or None,
            specialty_name=profile_data.get("specialty_name", ""),
            subspecialty_name=profile_data.get("subspecialty_name", ""),
            institution_name=profile_data.get("institution_name", ""),
            department_name=profile_data.get("department_name", ""),
            program_name=profile_data.get("program_name", ""),
            primary_office_phone=user_phone,
            alternate_phone=profile_data.get("alternate_phone", ""),
            official_email=user_email or None,
            room_or_office=profile_data.get("room_or_office", ""),
            availability_notes=profile_data.get("availability_notes", ""),
            supervision_status=profile_data.get("supervision_status", SupervisorProfile.Status.ACTIVE),
            max_active_residents=profile_data.get("max_active_residents", 5),
            can_supervise_thesis=profile_data.get("can_supervise_thesis", False),
            can_supervise_clinical_training=profile_data.get("can_supervise_clinical_training", True),
            notes=profile_data.get("notes", ""),
            extra_data=profile_data.get("extra_data", {}),
            created_by=created_by,
        )
        profile.save()

        # 3. Write Audit Logs
        log_audit(
            action="USER_CREATED",
            request=request,
            actor=created_by,
            target_model="accounts.User",
            target_id=user.pk,
            after={
                "username": user.username,
                "user_category": user.user_category,
                "must_change_password": user.must_change_password,
                "is_profile_complete": user.is_profile_complete,
            },
        )

        from django.forms import model_to_dict
        profile_dict = model_to_dict(profile)
        profile_dict["user"] = user.pk

        log_audit(
            action="SUPERVISOR_CREATED",
            request=request,
            actor=created_by,
            target_model="supervisors.SupervisorProfile",
            target_id=profile.pk,
            after=profile_dict,
        )

    return profile
