from __future__ import annotations

from typing import Any
from django.db import models
from audit.models import AuditLog


def get_client_ip(request) -> str | None:
    if not request:
        return None
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_audit(
    action: str,
    request: Any = None,
    actor: Any = None,
    target_model: str = "",
    target_id: str = "",
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    """
    Utility helper to log an administrative or authentication event to AuditLog.
    """
    ip_address = get_client_ip(request)
    user_agent = ""
    if request:
        user_agent = request.META.get("HTTP_USER_AGENT", "")
        if not actor and hasattr(request, "user") and request.user.is_authenticated:
            actor = request.user

    # Handle system actor if both request.user and actor are not set
    if actor and not actor.is_authenticated:
        actor = None

    log_entry = AuditLog.objects.create(
        actor=actor,
        action=action,
        target_model=target_model,
        target_id=str(target_id) if target_id else "",
        before=before,
        after=after,
        metadata=metadata or {},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    return log_entry
