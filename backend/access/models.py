from __future__ import annotations

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class UserRoleAssignment(models.Model):
    class Role(models.TextChoices):
        UTRMC_ADMIN_ACCESS = "UTRMC_ADMIN_ACCESS", "UTRMC Admin Access"
        SUPPORT_STAFF_ACCESS = "SUPPORT_STAFF_ACCESS", "Support Staff Access"
        DATA_ENTRY_ACCESS = "DATA_ENTRY_ACCESS", "Data Entry Access"
        AUDITOR_ACCESS = "AUDITOR_ACCESS", "Auditor Access"
        DEPARTMENT_ADMIN_ACCESS = "DEPARTMENT_ADMIN_ACCESS", "Department Admin Access"

    class ScopeType(models.TextChoices):
        GLOBAL = "GLOBAL", "Global Scope"
        INSTITUTION = "INSTITUTION", "Institution Scope"
        TRAINING_SITE = "TRAINING_SITE", "Training Site Scope"
        DEPARTMENT = "DEPARTMENT", "Department Scope"
        PROGRAM = "PROGRAM", "Program Scope"
        SPECIALTY = "SPECIALTY", "Specialty Scope"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="role_assignments",
    )
    role = models.CharField(max_length=50, choices=Role.choices)
    scope_type = models.CharField(
        max_length=50,
        choices=ScopeType.choices,
        default=ScopeType.GLOBAL,
    )

    institution = models.ForeignKey(
        "masters.Institution",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="role_assignments",
    )
    training_site = models.ForeignKey(
        "masters.TrainingSite",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="role_assignments",
    )
    department = models.ForeignKey(
        "masters.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="role_assignments",
    )
    program = models.ForeignKey(
        "masters.Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="role_assignments",
    )
    specialty = models.ForeignKey(
        "masters.Specialty",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="role_assignments",
    )

    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_roles",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()

        if self.is_active and self.expires_at and self.expires_at < timezone.now():
            raise ValidationError("Role assignment expiration date cannot be in the past.")

        # Enforce scope validation logic
        if self.scope_type == self.ScopeType.GLOBAL:
            if self.institution or self.training_site or self.department or self.program or self.specialty:
                raise ValidationError("Global scope cannot have references to master entities.")
        
        elif self.scope_type == self.ScopeType.INSTITUTION:
            if not self.institution:
                raise ValidationError("Institution must be specified for Institution Scope.")
            if self.training_site or self.department or self.program or self.specialty:
                raise ValidationError("Institution scope cannot specify training sites, departments, programs, or specialties.")
                
        elif self.scope_type == self.ScopeType.TRAINING_SITE:
            if not self.training_site:
                raise ValidationError("Training Site must be specified for Training Site Scope.")
            if self.department or self.program or self.specialty:
                raise ValidationError("Training site scope cannot specify departments, programs, or specialties.")
                
        elif self.scope_type == self.ScopeType.DEPARTMENT:
            if not self.department:
                raise ValidationError("Department must be specified for Department Scope.")
            if self.program or self.specialty:
                raise ValidationError("Department scope cannot specify programs or specialties.")
                
        elif self.scope_type == self.ScopeType.PROGRAM:
            if not self.program:
                raise ValidationError("Program must be specified for Program Scope.")
            if self.institution or self.training_site or self.department or self.specialty:
                raise ValidationError("Program scope cannot specify institutions, training sites, departments, or specialties.")
                
        elif self.scope_type == self.ScopeType.SPECIALTY:
            if not self.specialty:
                raise ValidationError("Specialty must be specified for Specialty Scope.")
            if self.institution or self.training_site or self.department:
                raise ValidationError("Specialty scope cannot specify institutions, training sites, or departments.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.role} ({self.scope_type})"
