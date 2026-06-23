from __future__ import annotations

from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    class Action(models.TextChoices):
        LOGIN_SUCCESS = "LOGIN_SUCCESS", "Login Success"
        LOGIN_FAILED = "LOGIN_FAILED", "Login Failed"
        LOGOUT = "LOGOUT", "Logout"
        PASSWORD_CHANGED = "PASSWORD_CHANGED", "Password Changed"
        PASSWORD_RESET_BY_ADMIN = "PASSWORD_RESET_BY_ADMIN", "Password Reset by Admin"
        PROFILE_COMPLETED = "PROFILE_COMPLETED", "Profile Completed"
        PROFILE_UPDATED = "PROFILE_UPDATED", "Profile Updated"
        USER_CREATED = "USER_CREATED", "User Created"
        USER_UPDATED = "USER_UPDATED", "User Updated"
        USER_DEACTIVATED = "USER_DEACTIVATED", "User Deactivated"
        USER_ACTIVATED = "USER_ACTIVATED", "User Activated"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        help_text="The user who performed the action",
    )
    action = models.CharField(
        max_length=50,
        choices=Action.choices,
        help_text="The type of action performed",
    )
    target_model = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Name of the model modified, if applicable",
    )
    target_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="ID of the target object modified",
    )
    before = models.JSONField(
        null=True,
        blank=True,
        help_text="The state of the object before modification",
    )
    after = models.JSONField(
        null=True,
        blank=True,
        help_text="The state of the object after modification",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Extra unstructured context metadata",
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the requester",
    )
    user_agent = models.TextField(
        blank=True,
        default="",
        help_text="User-agent of the requester",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp of when the audit log was recorded",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"

    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        return f"{self.created_at} - {actor_name}: {self.action} on {self.target_model or 'N/A'}"
