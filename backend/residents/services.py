from __future__ import annotations

from typing import Any
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction

from audit.utils import log_audit
from residents.models import ResidentProfile

User = get_user_model()


def validate_resident_uniqueness(
    username: str,
    cnic_or_passport: str,
    email: str | None = None,
    pmdc_number: str | None = None,
    exclude_resident_id: int | None = None,
) -> None:
    """
    Validates that username, email, CNIC, and PMDC are unique across User and ResidentProfile.
    """
    errors: dict[str, list[str]] = {}

    # 1. Check Username Uniqueness
    user_qs = User.objects.filter(username__iexact=username)
    if exclude_resident_id:
        profile = ResidentProfile.objects.filter(pk=exclude_resident_id).first()
        if profile:
            user_qs = user_qs.exclude(pk=profile.user.pk)
    if user_qs.exists():
        errors["username"] = ["A user with that username already exists."]

    # 2. Check Email Uniqueness
    if email and email.strip():
        email_clean = email.strip().lower()
        user_qs = User.objects.filter(email__iexact=email_clean)
        if exclude_resident_id:
            profile = ResidentProfile.objects.filter(pk=exclude_resident_id).first()
            if profile:
                user_qs = user_qs.exclude(pk=profile.user.pk)
        if user_qs.exists():
            errors["email"] = ["A user with that email already exists."]

    # 3. Check CNIC Uniqueness
    if cnic_or_passport and cnic_or_passport.strip():
        cnic_clean = cnic_or_passport.strip()
        profile_qs = ResidentProfile.objects.filter(cnic_or_passport__iexact=cnic_clean)
        if exclude_resident_id:
            profile_qs = profile_qs.exclude(pk=exclude_resident_id)
        if profile_qs.exists():
            errors["cnic_or_passport"] = ["A resident with this CNIC or Passport already exists."]

    # 4. Check PMDC Uniqueness
    if pmdc_number and pmdc_number.strip():
        pmdc_clean = pmdc_number.strip()
        profile_qs = ResidentProfile.objects.filter(pmdc_number__iexact=pmdc_clean)
        if exclude_resident_id:
            profile_qs = profile_qs.exclude(pk=exclude_resident_id)
        if profile_qs.exists():
            errors["pmdc_number"] = ["A resident with this PMDC number already exists."]

    if errors:
        raise ValidationError(errors)


def create_resident_with_user(
    user_data: dict[str, Any],
    profile_data: dict[str, Any],
    created_by: Any = None,
    request: Any = None,
) -> ResidentProfile:
    """
    Atomic transaction-safe service to create a User account (category RESIDENT) 
    and a linked ResidentProfile.
    """
    username = user_data.get("username", "").strip()
    cnic = profile_data.get("cnic_or_passport", "").strip()
    email = user_data.get("email") or profile_data.get("alternate_email")
    if email:
        email = email.strip()
    pmdc = profile_data.get("pmdc_number")
    if pmdc:
        pmdc = pmdc.strip()

    # Pre-validation for clean validation responses
    validate_resident_uniqueness(
        username=username,
        cnic_or_passport=cnic,
        email=email,
        pmdc_number=pmdc,
    )

    # Sync User profile completion criteria fields from profile data if not in user data
    user_full_name = user_data.get("full_name") or profile_data.get("full_name") or ""
    user_phone = user_data.get("phone") or profile_data.get("primary_phone") or ""
    user_email = email or ""

    is_complete = bool(user_full_name and user_phone and user_email)

    with transaction.atomic():
        # 1. Create User
        user = User(
            username=username,
            email=user_email or None,
            full_name=user_full_name,
            phone=user_phone,
            user_category="RESIDENT",
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

        # 2. Create ResidentProfile
        profile = ResidentProfile(
            user=user,
            father_name=profile_data.get("father_name", ""),
            cnic_or_passport=cnic,
            gender=profile_data.get("gender", ResidentProfile.Gender.MALE),
            date_of_birth=profile_data.get("date_of_birth"),
            primary_phone=user_phone,
            whatsapp_number=profile_data.get("whatsapp_number", ""),
            alternate_email=profile_data.get("alternate_email") or None,
            address=profile_data.get("address", ""),
            program_name=profile_data.get("program_name", ""),
            specialty_name=profile_data.get("specialty_name", ""),
            training_level=profile_data.get("training_level", ""),
            training_year=profile_data.get("training_year", ""),
            session_year=profile_data.get("session_year", ""),
            date_of_joining=profile_data.get("date_of_joining"),
            expected_completion_date=profile_data.get("expected_completion_date"),
            institution_name=profile_data.get("institution_name", ""),
            department_name=profile_data.get("department_name", ""),
            current_status=profile_data.get("current_status", ResidentProfile.Status.ACTIVE),
            pmdc_number=pmdc or None,
            university_registration_number=profile_data.get("university_registration_number", ""),
            employee_or_training_id=profile_data.get("employee_or_training_id", ""),
            emergency_contact_name=profile_data.get("emergency_contact_name", ""),
            emergency_contact_phone=profile_data.get("emergency_contact_phone", ""),
            emergency_contact_relation=profile_data.get("emergency_contact_relation", ""),
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
        # remove file relation fields or serialize them as IDs
        profile_dict["user"] = user.pk

        log_audit(
            action="RESIDENT_CREATED",
            request=request,
            actor=created_by,
            target_model="residents.ResidentProfile",
            target_id=profile.pk,
            after=profile_dict,
        )

    return profile
