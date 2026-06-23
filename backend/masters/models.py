from __future__ import annotations

from django.conf import settings
from django.db import models


class BaseMasterModel(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_updated",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["sort_order", "name"]

    def clean(self):
        super().clean()
        if self.code:
            self.code = self.code.strip().upper()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Institution(BaseMasterModel):
    short_name = models.CharField(max_length=50, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    extra_data = models.JSONField(default=dict, blank=True)


class TrainingSite(BaseMasterModel):
    class SiteType(models.TextChoices):
        UNIVERSITY = "UNIVERSITY", "University"
        HOSPITAL = "HOSPITAL", "Hospital"
        COLLEGE = "COLLEGE", "College"
        INSTITUTE = "INSTITUTE", "Institute"
        OTHER = "OTHER", "Other"

    institution = models.ForeignKey(
        Institution,
        on_delete=models.PROTECT,
        related_name="training_sites",
    )
    short_name = models.CharField(max_length=50, blank=True, default="")
    site_type = models.CharField(
        max_length=50,
        choices=SiteType.choices,
        default=SiteType.HOSPITAL,
    )
    city = models.CharField(max_length=100, blank=True, default="")
    address = models.TextField(blank=True, default="")
    extra_data = models.JSONField(default=dict, blank=True)


class Department(BaseMasterModel):
    training_site = models.ForeignKey(
        TrainingSite,
        on_delete=models.PROTECT,
        related_name="departments",
    )
    short_name = models.CharField(max_length=50, blank=True, default="")
    is_clinical = models.BooleanField(default=True)
    extra_data = models.JSONField(default=dict, blank=True)


class Program(BaseMasterModel):
    class ProgramType(models.TextChoices):
        FCPS = "FCPS", "FCPS"
        MD = "MD", "MD"
        MS = "MS", "MS"
        MPHIL = "MPHIL", "MPhil"
        DIPLOMA = "DIPLOMA", "Diploma"
        OTHER = "OTHER", "Other"

    program_type = models.CharField(
        max_length=50,
        choices=ProgramType.choices,
        default=ProgramType.FCPS,
    )
    duration_years = models.PositiveIntegerField(default=4)
    extra_data = models.JSONField(default=dict, blank=True)


class Specialty(BaseMasterModel):
    program = models.ForeignKey(
        Program,
        on_delete=models.PROTECT,
        related_name="specialties",
    )
    extra_data = models.JSONField(default=dict, blank=True)


class Designation(BaseMasterModel):
    extra_data = models.JSONField(default=dict, blank=True)


class AcademicSession(BaseMasterModel):
    start_year = models.PositiveIntegerField()
    end_year = models.PositiveIntegerField()
    extra_data = models.JSONField(default=dict, blank=True)
