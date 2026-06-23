from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from access.models import UserRoleAssignment
from audit.models import AuditLog
from masters.models import Institution, Department, Program, Specialty, TrainingSite

User = get_user_model()


class UserRoleAssignmentModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="scoped_user",
            email="scoped@example.com",
            user_category="SUPPORT_STAFF",
        )
        self.inst = Institution.objects.create(name="FMU", code="FMU")
        self.site = TrainingSite.objects.create(name="Allied Hospital", code="AH", institution=self.inst)
        self.dept = Department.objects.create(name="Peds", code="PEDS", training_site=self.site)
        self.prog = Program.objects.create(name="FCPS", code="FCPS")
        self.spec = Specialty.objects.create(name="Cardiology", code="CARD", program=self.prog)

    def test_global_scope_validation(self):
        """Global scope must not have master references."""
        assignment = UserRoleAssignment(
            user=self.user,
            role=UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS,
            scope_type=UserRoleAssignment.ScopeType.GLOBAL,
            institution=self.inst,
        )
        with self.assertRaises(ValidationError):
            assignment.save()

        # Success case
        assignment.institution = None
        assignment.save()
        self.assertIsNotNone(assignment.pk)

    def test_institution_scope_validation(self):
        """Institution scope requires institution reference and forbids others."""
        assignment = UserRoleAssignment(
            user=self.user,
            role=UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS,
            scope_type=UserRoleAssignment.ScopeType.INSTITUTION,
        )
        with self.assertRaises(ValidationError):
            assignment.save()

        # Forbids others
        assignment.institution = self.inst
        assignment.department = self.dept
        with self.assertRaises(ValidationError):
            assignment.save()

        # Success case
        assignment.department = None
        assignment.save()
        self.assertIsNotNone(assignment.pk)

    def test_department_scope_validation(self):
        """Department scope requires department reference and forbids programs/specialties."""
        assignment = UserRoleAssignment(
            user=self.user,
            role=UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS,
            scope_type=UserRoleAssignment.ScopeType.DEPARTMENT,
        )
        with self.assertRaises(ValidationError):
            assignment.save()

        assignment.department = self.dept
        assignment.program = self.prog
        with self.assertRaises(ValidationError):
            assignment.save()

        # Success case
        assignment.program = None
        assignment.save()
        self.assertIsNotNone(assignment.pk)

    def test_expiration_date_in_past(self):
        """Expiration date cannot be in the past if active."""
        past_time = timezone.now() - timezone.timedelta(days=1)
        assignment = UserRoleAssignment(
            user=self.user,
            role=UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS,
            scope_type=UserRoleAssignment.ScopeType.GLOBAL,
            expires_at=past_time,
        )
        with self.assertRaises(ValidationError):
            assignment.save()


class UserRoleAssignmentAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpassword123",
        )
        self.role_manager = User.objects.create_user(
            username="role_mgr",
            email="mgr@example.com",
            user_category="SUPPORT_STAFF",
            password="mgrpassword123",
        )
        # Assign role manager capability
        UserRoleAssignment.objects.create(
            user=self.role_manager,
            role=UserRoleAssignment.Role.UTRMC_ADMIN_ACCESS,
            scope_type=UserRoleAssignment.ScopeType.GLOBAL,
        )

        self.normal_user = User.objects.create_user(
            username="normal_user",
            email="normal@example.com",
            user_category="SUPPORT_STAFF",
            password="normalpassword123",
        )
        
        self.target_user = User.objects.create_user(
            username="target_user",
            email="target@example.com",
            user_category="SUPPORT_STAFF",
        )

    def test_unauthorized_user_cannot_access_assignments(self):
        """Standard staff users without UTRMC_ADMIN_ACCESS role assignment cannot CRUD assignments."""
        self.client.force_authenticate(user=self.normal_user)

        response = self.client.get(reverse("role-assignment-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.post(
            reverse("role-assignment-list"),
            {
                "user": self.target_user.pk,
                "role": UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS,
                "scope_type": UserRoleAssignment.ScopeType.GLOBAL,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_role_manager_can_crud_and_audit(self):
        """User with UTRMC_ADMIN_ACCESS role assignment can manage roles and generate audit trails."""
        self.client.force_authenticate(user=self.role_manager)

        # Create
        response = self.client.post(
            reverse("role-assignment-list"),
            {
                "user": self.target_user.pk,
                "role": UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS,
                "scope_type": UserRoleAssignment.ScopeType.GLOBAL,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        assignment_id = response.data["id"]

        audit_create = AuditLog.objects.filter(
            action="ROLE_ASSIGNMENT_CREATED",
            target_model="access.UserRoleAssignment",
            target_id=assignment_id,
        ).first()
        self.assertIsNotNone(audit_create)
        self.assertEqual(audit_create.actor, self.role_manager)

        # Soft Delete (Deactivate)
        response = self.client.delete(
            reverse("role-assignment-detail", kwargs={"pk": assignment_id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check status
        assignment = UserRoleAssignment.objects.get(pk=assignment_id)
        self.assertFalse(assignment.is_active)

        audit_deactivate = AuditLog.objects.filter(
            action="ROLE_ASSIGNMENT_DEACTIVATED",
            target_model="access.UserRoleAssignment",
            target_id=assignment_id,
        ).first()
        self.assertIsNotNone(audit_deactivate)
