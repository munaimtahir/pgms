from __future__ import annotations

from django.contrib.auth.models import AbstractUser, UserManager as BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_profile_complete", False)
        extra_fields.setdefault("must_change_password", True)
        return super().create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("user_category", "UTRMC_ADMIN")
        extra_fields.setdefault("is_profile_complete", True)
        extra_fields.setdefault("must_change_password", False)
        
        if extra_fields.get("user_category") != "UTRMC_ADMIN":
            raise ValueError("Superuser must have user_category='UTRMC_ADMIN'.")
            
        return super().create_superuser(username, email, password, **extra_fields)


class User(AbstractUser):
    class Category(models.TextChoices):
        RESIDENT = "RESIDENT", "Resident"
        SUPERVISOR = "SUPERVISOR", "Supervisor"
        SUPPORT_STAFF = "SUPPORT_STAFF", "Support Staff"
        UTRMC_ADMIN = "UTRMC_ADMIN", "UTRMC Admin"

    full_name = models.CharField(max_length=255, blank=True, default="")
    phone = models.CharField(max_length=50, blank=True, default="")
    
    # Nullable unique email for future OAuth/email login compatibility
    email = models.EmailField(
        unique=True,
        null=True,
        blank=True,
        error_messages={
            "unique": "A user with that email already exists.",
        },
    )

    user_category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.RESIDENT,
    )
    
    is_profile_complete = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=True)
    
    extra_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    def clean(self):
        super().clean()
        # Normalize blank/empty/whitespace emails to None to avoid unique collision on empty strings
        if self.email:
            self.email = self.email.strip()
            if not self.email:
                self.email = None
        else:
            self.email = None

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_user_category_display()})"
