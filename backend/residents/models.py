from __future__ import annotations

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class ResidentProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ON_LEAVE = "ON_LEAVE", "On Leave"
        TRANSFERRED = "TRANSFERRED", "Transferred"
        COMPLETED = "COMPLETED", "Completed"
        DROPPED = "DROPPED", "Dropped"
        SUSPENDED = "SUSPENDED", "Suspended"
        UNKNOWN = "UNKNOWN", "Unknown"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="resident_profile",
        help_text="The linked User account representing identity and credentials",
    )

    father_name = models.CharField(max_length=255, blank=True, default="")
    cnic_or_passport = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique national identification number (CNIC or Passport)",
    )
    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        default=Gender.MALE,
    )
    date_of_birth = models.DateField(null=True, blank=True)

    primary_phone = models.CharField(max_length=50, blank=True, default="")
    primary_phone_normalized = models.CharField(max_length=50, blank=True, default="")
    whatsapp_number = models.CharField(max_length=50, blank=True, default="")
    whatsapp_number_normalized = models.CharField(max_length=50, blank=True, default="")
    alternate_email = models.EmailField(null=True, blank=True)
    address = models.TextField(blank=True, default="")

    # Training and Academics
    program_name = models.CharField(max_length=255, blank=True, default="")
    specialty_name = models.CharField(max_length=255, blank=True, default="")
    training_level = models.CharField(max_length=50, blank=True, default="")
    training_year = models.CharField(max_length=50, blank=True, default="")
    session_year = models.CharField(max_length=50, blank=True, default="")
    date_of_joining = models.DateField(null=True, blank=True)
    expected_completion_date = models.DateField(null=True, blank=True)

    # Department and Hospital Scope (Temporary Text Fields)
    institution_name = models.CharField(max_length=255, blank=True, default="")
    department_name = models.CharField(max_length=255, blank=True, default="")

    # Master References
    institution_ref = models.ForeignKey(
        "masters.Institution",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="residents",
    )
    training_site_ref = models.ForeignKey(
        "masters.TrainingSite",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="residents",
    )
    department_ref = models.ForeignKey(
        "masters.Department",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="residents",
    )
    program_ref = models.ForeignKey(
        "masters.Program",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="residents",
    )
    specialty_ref = models.ForeignKey(
        "masters.Specialty",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="residents",
    )
    academic_session_ref = models.ForeignKey(
        "masters.AcademicSession",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="residents",
    )

    
    current_status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    # Identifiers
    pmdc_number = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="Pakistan Medical & Dental Council registration number",
    )
    university_registration_number = models.CharField(max_length=100, blank=True, default="")
    employee_or_training_id = models.CharField(max_length=100, blank=True, default="")

    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=255, blank=True, default="")
    emergency_contact_phone = models.CharField(max_length=50, blank=True, default="")
    emergency_contact_relation = models.CharField(max_length=100, blank=True, default="")

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
        related_name="archived_residents",
    )

    # Meta Audit Fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_residents",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_residents",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()
        # Enforce OneToOne category logic
        if self.user and self.user.user_category != "RESIDENT":
            raise ValidationError("Linked User must have user_category='RESIDENT'.")

        # Normalize unique nullable pmdc_number
        if self.pmdc_number:
            self.pmdc_number = self.pmdc_number.strip()
            if not self.pmdc_number:
                self.pmdc_number = None
        else:
            self.pmdc_number = None

        # Normalize alternate_email
        if self.alternate_email:
            self.alternate_email = self.alternate_email.strip().lower()
            if not self.alternate_email:
                self.alternate_email = None
        else:
            self.alternate_email = None

        # Basic phone normalization (stripping spaces, brackets, dashes)
        if self.primary_phone:
            self.primary_phone_normalized = "".join(c for c in self.primary_phone if c.isdigit() or c == "+")
        if self.whatsapp_number:
            self.whatsapp_number_normalized = "".join(c for c in self.whatsapp_number if c.isdigit() or c == "+")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.full_name or self.user.username} - {self.program_name} ({self.current_status})"
