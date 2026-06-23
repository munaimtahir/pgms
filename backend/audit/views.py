from __future__ import annotations

from rest_framework import viewsets
from accounts.permissions import IsUtrmcAdmin
from audit.models import AuditLog
from audit.serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for UTRMC admins to browse the system audit trail.
    """

    queryset = AuditLog.objects.all().order_by("-created_at")
    serializer_class = AuditLogSerializer
    permission_classes = [IsUtrmcAdmin]
