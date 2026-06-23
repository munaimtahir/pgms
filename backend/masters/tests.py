from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from access.models import UserRoleAssignment
from audit.models import AuditLog
from masters.models import (
    AcademicSession,
    Department,
    Designation,
    Institution,
    Program,
    Specialty,
    TrainingSite,
)
from residents.models import ResidentProfile
from supervisors.models import SupervisorProfile

User = get_user_model()


class MasterModelTests(TestCase):
    def test_base_master_model_code_slugification(self):
        """Verify that master model codes are stripped and uppercased on save."""
        inst = Institution.objects.create(
            name="Faisalabad Medical University",
            code="  fmu-01  ",
            city="Faisalabad",
        )
        self.assertEqual(inst.code, "FMU-01")

    def test_relationship_hierarchies(self):
        """Test the master relationships and constraints."""
        inst = Institution.objects.create(name="FMU", code="FMU")
        site = TrainingSite.objects.create(
            institution=inst,
            name="Allied Hospital",
            code="AH",
            site_type=TrainingSite.SiteType.HOSPITAL,
        )
        dept = Department.objects.create(
            training_site=site,
            name="Pediatrics",
            code="PEDS",
        )
        prog = Program.objects.create(
            name="FCPS Pediatrics",
            code="FCPS-PEDS",
            program_type=Program.ProgramType.FCPS,
        )
        spec = Specialty.objects.create(
            program=prog,
            name="Pediatric Cardiology",
            code="PEDS-CARD",
        )

        self.assertEqual(site.institution, inst)
        self.assertEqual(dept.training_site, site)
        self.assertEqual(spec.program, prog)

    def test_profile_references_compatibility(self):
        """Verify Resident and Supervisor profiles can link to master records."""
        inst = Institution.objects.create(name="FMU", code="FMU")
        site = TrainingSite.objects.create(
            institution=inst,
            name="Allied Hospital",
            code="AH",
        )
        dept = Department.objects.create(
            training_site=site,
            name="Pediatrics",
            code="PEDS",
        )
        prog = Program.objects.create(name="FCPS", code="FCPS")
        spec = Specialty.objects.create(program=prog, name="Cardiology", code="CARD")
        desig = Designation.objects.create(name="Professor", code="PROF")

        res_user = User.objects.create_user(
            username="resident1",
            email="res1@example.com",
            user_category="RESIDENT",
        )
        sup_user = User.objects.create_user(
            username="supervisor1",
            email="sup1@example.com",
            user_category="SUPERVISOR",
        )

        res_profile = ResidentProfile.objects.create(
            user=res_user,
            cnic_or_passport="12345-1234567-1",
            pmdc_number="11111-P",
            institution_ref=inst,
            training_site_ref=site,
            department_ref=dept,
            program_ref=prog,
            specialty_ref=spec,
        )

        sup_profile = SupervisorProfile.objects.create(
            user=sup_user,
            pmdc_number="22222-P",
            institution_ref=inst,
            training_site_ref=site,
            department_ref=dept,
            program_ref=prog,
            specialty_ref=spec,
            designation_ref=desig,
        )

        self.assertEqual(res_profile.institution_ref, inst)
        self.assertEqual(res_profile.training_site_ref, site)
        self.assertEqual(res_profile.department_ref, dept)
        self.assertEqual(res_profile.program_ref, prog)
        self.assertEqual(res_profile.specialty_ref, spec)

        self.assertEqual(sup_profile.institution_ref, inst)
        self.assertEqual(sup_profile.training_site_ref, site)
        self.assertEqual(sup_profile.department_ref, dept)
        self.assertEqual(sup_profile.program_ref, prog)
        self.assertEqual(sup_profile.specialty_ref, spec)
        self.assertEqual(sup_profile.designation_ref, desig)


class MasterAPITestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="utrmc_admin",
            email="admin@example.com",
            password="adminpassword123",
        )
        self.staff_user = User.objects.create_user(
            username="staff_user",
            email="staff@example.com",
            user_category="SUPPORT_STAFF",
            password="staffpassword123",
        )
        self.inst = Institution.objects.create(name="FMU", code="FMU")

    def test_anonymous_user_cannot_access(self):
        """Unauthenticated requests are blocked."""
        response = self.client.get(reverse("institution-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_has_read_only(self):
        """Authenticated non-admin user can read but not write to masters."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Read is allowed
        response = self.client.get(reverse("institution-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Create is forbidden
        response = self.client.post(
            reverse("institution-list"),
            {"name": "New Inst", "code": "NEW"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_role_assigned_user_can_write(self):
        """User with UTRMC_ADMIN_ACCESS role assignment can perform write actions."""
        # Assign role
        UserRoleAssignment.objects.create(
            user=self.staff_user,
            role=UserRoleAssignment.Role.UTRMC_ADMIN_ACCESS,
            scope_type=UserRoleAssignment.ScopeType.GLOBAL,
        )

        self.client.force_authenticate(user=self.staff_user)

        response = self.client.post(
            reverse("institution-list"),
            {"name": "New Inst", "code": "NEW"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_can_crud_and_audit(self):
        """UTRMC admin can do everything and audit log is created."""
        self.client.force_authenticate(user=self.admin)

        # Create
        response = self.client.post(
            reverse("institution-list"),
            {"name": "D-Hock", "code": "DHQ"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        inst_id = response.data["id"]

        audit_create = AuditLog.objects.filter(
            action="MASTER_CREATED",
            target_model="masters.Institution",
            target_id=inst_id,
        ).first()
        self.assertIsNotNone(audit_create)
        self.assertEqual(audit_create.actor, self.admin)

        # Soft Delete (Deactivate)
        response = self.client.delete(
            reverse("institution-detail", kwargs={"pk": inst_id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check deactivated status
        inst = Institution.objects.get(pk=inst_id)
        self.assertFalse(inst.is_active)

        audit_deactivate = AuditLog.objects.filter(
            action="MASTER_DEACTIVATED",
            target_model="masters.Institution",
            target_id=inst_id,
        ).first()
        self.assertIsNotNone(audit_deactivate)
