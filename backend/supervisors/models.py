from __future__ import annotations

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class SupervisorProfile(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ON_LEAVE = "ON_LEAVE", "On Leave"
        RETIRED = "RETIRED", "Retired"
        TRANSFERRED = "TRANSFERRED", "Transferred"
        SUSPENDED = "SUSPENDED", "Suspended"
        INACTIVE = "INACTIVE", "Inactive"
        UNKNOWN = "UNKNOWN", "Unknown"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="supervisor_profile",
        help_text="The linked User account representing identity and credentials",
    )

    designation = models.CharField(max_length=255, blank=True, default="")
    qualification = models.CharField(max_length=255, blank=True, default="")
    pmdc_number = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="Pakistan Medical & Dental Council registration number",
    )
    specialty_name = models.CharField(max_length=255, blank=True, default="")
    subspecialty_name = models.CharField(max_length=255, blank=True, default="")

    # Department and Institution Scope (Temporary Text Fields)
    institution_name = models.CharField(max_length=255, blank=True, default="")
    department_name = models.CharField(max_length=255, blank=True, default="")
    program_name = models.CharField(max_length=255, blank=True, default="")

    primary_office_phone = models.CharField(max_length=50, blank=True, default="")
    primary_office_phone_normalized = models.CharField(max_length=50, blank=True, default="")
    alternate_phone = models.CharField(max_length=50, blank=True, default="")
    alternate_phone_normalized = models.CharField(max_length=50, blank=True, default="")
    official_email = models.EmailField(
        unique=True,
        null=True,
        blank=True,
        help_text="Official institutional email",
    )
    room_or_office = models.CharField(max_length=100, blank=True, default="")
    availability_notes = models.TextField(blank=True, default="")

    supervision_status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    max_active_residents = models.PositiveIntegerField(default=5)
    can_supervise_thesis = models.BooleanField(default=False)
    can_supervise_clinical_training = models.BooleanField(default=True)

    notes = models.TextField(blank=True, default="")
    extra_data = models.JSONField(default=dict, blank=True)

    # Archiving
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="archived_supervisors",
    )

    # Meta Audit Fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_supervisors",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_supervisors",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()
        # Enforce OneToOne category logic
        if self.user and self.user.user_category != "SUPERVISOR":
            raise ValidationError("Linked User must have user_category='SUPERVISOR'.")

        # Normalize unique nullable pmdc_number
        if self.pmdc_number:
            self.pmdc_number = self.pmdc_number.strip()
            if not self.pmdc_number:
                self.pmdc_number = None
        else:
            self.pmdc_number = None

        # Normalize official_email
        if self.official_email:
            self.official_email = self.official_email.strip().lower()
            if not self.official_email:
                self.official_email = None
        else:
            self.official_email = None

        # Basic phone normalization
        if self.primary_office_phone:
            self.primary_office_phone_normalized = "".join(c for c in self.primary_office_phone if c.isdigit() or c == "+")
        if self.alternate_phone:
            self.alternate_phone_normalized = "".join(c for c in self.alternate_phone if c.isdigit() or c == "+")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.full_name or self.user.username} - {self.designation} ({self.supervision_status})"
