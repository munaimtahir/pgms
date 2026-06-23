from __future__ import annotations

from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from audit.models import AuditLog
from residents.models import ResidentProfile
from residents.services import create_resident_with_user, validate_resident_uniqueness
from access.models import UserRoleAssignment

User = get_user_model()


class ResidentModelTests(TestCase):
    def setUp(self):
        self.resident_user = User.objects.create_user(
            username="res1",
            email="res1@example.com",
            user_category="RESIDENT",
        )
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
        )

    def test_resident_profile_cannot_exist_without_user(self):
        """Test that profile cannot be saved without a linked User."""
        profile = ResidentProfile(
            cnic_or_passport="12345-6789012-3",
            pmdc_number="12345-D",
        )
        with self.assertRaises(Exception):
            profile.save()

    def test_resident_profile_cannot_link_to_non_resident_user(self):
        """Test validation error if linking to non-RESIDENT user."""
        profile = ResidentProfile(
            user=self.admin_user,
            cnic_or_passport="12345-6789012-3",
            pmdc_number="12345-D",
        )
        with self.assertRaises(ValidationError) as ctx:
            profile.save()
        self.assertIn("Linked User must have user_category='RESIDENT'", str(ctx.exception))

    def test_phone_normalization_on_save(self):
        """Verify phone numbers are normalized to digits and plus signs."""
        profile = ResidentProfile(
            user=self.resident_user,
            cnic_or_passport="12345-6789012-3",
            pmdc_number="12345-D",
            primary_phone="+92 (300) 123-4567",
            whatsapp_number="0300 123 4567",
        )
        profile.save()
        self.assertEqual(profile.primary_phone_normalized, "+923001234567")
        self.assertEqual(profile.whatsapp_number_normalized, "03001234567")


class ResidentServiceTests(TestCase):
    def setUp(self):
        pass

    def test_create_resident_with_user_success(self):
        """Verify atomic user and profile creation."""
        user_data = {
            "username": "resident_service",
            "email": "service@example.com",
            "full_name": "Service Resident",
            "phone": "03009999999",
            "password": "securepassword123",
        }
        profile_data = {
            "cnic_or_passport": "54321-1234567-8",
            "pmdc_number": "99999-D",
            "program_name": "FCPS",
            "specialty_name": "Pediatrics",
            "institution_name": "FMU",
            "department_name": "Pediatrics Unit 1",
        }

        profile = create_resident_with_user(user_data, profile_data)
        
        self.assertIsNotNone(profile)
        self.assertEqual(profile.user.username, "resident_service")
        self.assertEqual(profile.user.user_category, "RESIDENT")
        self.assertTrue(profile.user.must_change_password)
        self.assertEqual(profile.cnic_or_passport, "54321-1234567-8")
        self.assertEqual(profile.pmdc_number, "99999-D")

        # Verify audit logs
        user_log = AuditLog.objects.filter(action="USER_CREATED", target_id=profile.user.pk).first()
        profile_log = AuditLog.objects.filter(action="RESIDENT_CREATED", target_id=profile.pk).first()
        
        self.assertIsNotNone(user_log)
        self.assertIsNotNone(profile_log)

    def test_create_resident_with_user_rollback_on_profile_failure(self):
        """Ensure User creation is rolled back if profile creation fails."""
        user_data = {
            "username": "resident_rollback",
            "email": "rollback@example.com",
            "full_name": "Rollback Resident",
            "phone": "03008888888",
        }
        profile_data = {
            "cnic_or_passport": "11111-2222222-3",
        }

        # Mock ResidentProfile.save to fail
        with patch.object(ResidentProfile, "save", side_effect=ValidationError("Mock save error")):
            with self.assertRaises(ValidationError):
                create_resident_with_user(user_data, profile_data)

        # Assert User was not created
        self.assertFalse(User.objects.filter(username="resident_rollback").exists())

    def test_duplicate_checks(self):
        """Test validate_resident_uniqueness raises ValidationError on duplicates."""
        # Setup one resident
        user_data = {
            "username": "unique_res",
            "email": "dup@example.com",
            "full_name": "Unique Resident",
            "phone": "03001111111",
        }
        profile_data = {
            "cnic_or_passport": "11111-1111111-1",
            "pmdc_number": "11111-P",
        }
        create_resident_with_user(user_data, profile_data)

        # Check duplicate username
        with self.assertRaises(ValidationError) as ctx:
            validate_resident_uniqueness("unique_res", "22222-2222222-2")
        self.assertIn("username", ctx.exception.message_dict)

        # Check duplicate email
        with self.assertRaises(ValidationError) as ctx:
            validate_resident_uniqueness("other_res", "22222-2222222-2", email="dup@example.com")
        self.assertIn("email", ctx.exception.message_dict)

        # Check duplicate CNIC
        with self.assertRaises(ValidationError) as ctx:
            validate_resident_uniqueness("other_res", "11111-1111111-1")
        self.assertIn("cnic_or_passport", ctx.exception.message_dict)

        # Check duplicate PMDC
        with self.assertRaises(ValidationError) as ctx:
            validate_resident_uniqueness("other_res", "22222-2222222-2", pmdc_number="11111-P")
        self.assertIn("pmdc_number", ctx.exception.message_dict)


class ResidentAPIPermissionTests(APITestCase):
    def setUp(self):
        # Create users for all categories
        self.admin = User.objects.create_superuser(username="admin_api", password="password")
        self.support = User.objects.create_user(username="support_api", password="password", user_category="SUPPORT_STAFF", is_profile_complete=True, must_change_password=False)
        self.supervisor = User.objects.create_user(username="supervisor_api", password="password", user_category="SUPERVISOR", is_profile_complete=True, must_change_password=False)
        
        # Setup master metadata
        from masters.models import Institution, TrainingSite, Department, Program, AcademicSession
        self.inst = Institution.objects.create(name="FMU", code="FMU")
        self.site = TrainingSite.objects.create(name="Allied Hospital", code="AH", institution=self.inst)
        self.dept = Department.objects.create(name="Cardiology", code="CARD", training_site=self.site)
        self.prog = Program.objects.create(name="FCPS", code="FCPS")
        self.session = AcademicSession.objects.create(name="2026 Session", code="2026", start_year=2026, end_year=2030)

        # Setup support staff scope
        UserRoleAssignment.objects.create(
            user=self.support,
            role=UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS,
            scope_type=UserRoleAssignment.ScopeType.GLOBAL,
        )

        # Create a resident with profile
        user_data = {
            "username": "resident_api",
            "email": "res_api@example.com",
            "full_name": "API Resident",
            "phone": "03001234567",
            "password": "password",
        }
        profile_data = {
            "cnic_or_passport": "12345-0000000-0",
            "pmdc_number": "12345-A",
            "program_name": "FCPS",
            "specialty_name": "Cardiology",
            "training_site_ref": self.site,
            "department_ref": self.dept,
            "program_ref": self.prog,
            "academic_session_ref": self.session,
        }
        self.resident_profile = create_resident_with_user(user_data, profile_data)
        self.resident_user = self.resident_profile.user
        
        # We need to make resident bypass must_change_password/complete_profile gates for regular endpoint tests
        self.resident_user.must_change_password = False
        self.resident_user.is_profile_complete = True
        self.resident_user.save()

        # Endpoint URL
        self.list_url = reverse("resident-list")
        self.detail_url = reverse("resident-detail", args=[self.resident_profile.pk])
        self.unarchive_url = reverse("resident-unarchive", args=[self.resident_profile.pk])
        self.duplicate_check_url = reverse("resident-check-duplicates")
        self.login_url = reverse("auth-login")

    def get_headers(self, username, password="password"):
        response = self.client.post(self.login_url, {"username": username, "password": password})
        self.assertEqual(response.status_code, 200)
        return {"HTTP_AUTHORIZATION": f"Bearer {response.data['access']}"}

    def test_utrmc_admin_permissions(self):
        """UTRMC Admin can perform all operations, archive/unarchive."""
        headers = self.get_headers("admin_api")

        # Browse list
        response = self.client.get(self.list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Create
        create_payload = {
            "username": "new_resident_api",
            "email": "new_api@example.com",
            "full_name": "New API Resident",
            "phone": "03009876543",
            "cnic_or_passport": "99999-9999999-9",
            "pmdc_number": "99999-Z",
            "training_site_ref": self.site.pk,
            "department_ref": self.dept.pk,
            "program_ref": self.prog.pk,
            "academic_session_ref": self.session.pk,
        }
        response = self.client.post(self.list_url, create_payload, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        new_res = ResidentProfile.objects.get(cnic_or_passport="99999-9999999-9")

        # Archive (Soft delete)
        detail_url = reverse("resident-detail", args=[new_res.pk])
        response = self.client.delete(detail_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        new_res.refresh_from_db()
        self.assertTrue(new_res.is_archived)
        self.assertFalse(new_res.user.is_active)

        # Unarchive
        unarchive_url = reverse("resident-unarchive", args=[new_res.pk])
        response = self.client.post(unarchive_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        new_res.refresh_from_db()
        self.assertFalse(new_res.is_archived)
        self.assertTrue(new_res.user.is_active)

    def test_support_staff_permissions(self):
        """Support staff can view, create, edit, but CANNOT archive."""
        headers = self.get_headers("support_api")

        # View List
        response = self.client.get(self.list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Create
        create_payload = {
            "username": "support_created",
            "email": "support_created@example.com",
            "full_name": "Support Created Resident",
            "phone": "03001112222",
            "cnic_or_passport": "88888-8888888-8",
            "training_site_ref": self.site.pk,
            "department_ref": self.dept.pk,
            "program_ref": self.prog.pk,
            "academic_session_ref": self.session.pk,
        }
        response = self.client.post(self.list_url, create_payload, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_res = ResidentProfile.objects.get(cnic_or_passport="88888-8888888-8")

        # Update
        detail_url = reverse("resident-detail", args=[new_res.pk])
        response = self.client.patch(detail_url, {"father_name": "Support Staff Update"}, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        new_res.refresh_from_db()
        self.assertEqual(new_res.father_name, "Support Staff Update")

        # Archive (Should be blocked)
        response = self.client.delete(detail_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Unarchive (Should be blocked)
        unarchive_url = reverse("resident-unarchive", args=[new_res.pk])
        response = self.client.post(unarchive_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_resident_self_access_only(self):
        """Resident can view and edit own profile only. Cannot view list or others."""
        headers = self.get_headers("resident_api")

        # List is blocked
        response = self.client.get(self.list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # View own detail is allowed
        response = self.client.get(self.detail_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Update own detail is allowed
        response = self.client.patch(self.detail_url, {"address": "New Resident Address"}, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.resident_profile.refresh_from_db()
        self.assertEqual(self.resident_profile.address, "New Resident Address")

        # View another resident's profile (create another one first)
        other_user = User.objects.create_user(username="other_res_api", user_category="RESIDENT")
        other_profile = ResidentProfile.objects.create(
            user=other_user,
            cnic_or_passport="77777-7777777-7",
        )
        other_detail_url = reverse("resident-detail", args=[other_profile.pk])
        
        response = self.client.get(other_detail_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # filtered out in get_queryset

    def test_supervisor_is_blocked_completely(self):
        """Supervisors are completely blocked from directory endpoints in Brick 2."""
        headers = self.get_headers("supervisor_api")

        # List is blocked
        response = self.client.get(self.list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Detail is blocked
        response = self.client.get(self.detail_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_check_api(self):
        """Test check-duplicates API endpoint."""
        headers = self.get_headers("support_api")

        payload = {
            "username": "resident_api",  # duplicate username
            "cnic_or_passport": "12345-0000000-0",  # duplicate CNIC
            "email": "res_api@example.com",  # duplicate email
            "pmdc_number": "12345-A",  # duplicate PMDC
        }
        response = self.client.post(self.duplicate_check_url, payload, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["has_duplicates"])
        self.assertIn("username", response.data["duplicates"])
        self.assertIn("cnic_or_passport", response.data["duplicates"])
        self.assertIn("email", response.data["duplicates"])
        self.assertIn("pmdc_number", response.data["duplicates"])


class ResidentIdentityScopingTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin_user",
            email="admin@example.com",
            password="adminpassword123",
        )
        self.staff_user = User.objects.create_user(
            username="staff_scoped",
            email="staff_scoped@example.com",
            user_category="SUPPORT_STAFF",
            password="staffpassword123",
        )
        self.staff_user.must_change_password = False
        self.staff_user.is_profile_complete = True
        self.staff_user.save()
        
        # Setup master metadata
        from masters.models import Institution, TrainingSite, Department, Program, AcademicSession
        self.inst = Institution.objects.create(name="FMU", code="FMU")
        self.site = TrainingSite.objects.create(name="Allied Hospital", code="AH", institution=self.inst)
        self.dept = Department.objects.create(name="Cardiology", code="CARD", training_site=self.site)
        self.prog = Program.objects.create(name="FCPS", code="FCPS")
        self.session = AcademicSession.objects.create(name="2026 Session", code="2026", start_year=2026, end_year=2030)

        # Setup support staff scope to Allied Hospital
        UserRoleAssignment.objects.create(
            user=self.staff_user,
            role=UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS,
            scope_type=UserRoleAssignment.ScopeType.TRAINING_SITE,
            training_site=self.site,
        )

    def test_new_resident_creation_enforces_identity_fks(self):
        """Create resident requires training_site, department, program, session."""
        self.client.force_authenticate(user=self.admin)
        
        # Missing department_ref
        payload = {
            "username": "new_resident",
            "email": "new_res@example.com",
            "full_name": "New Resident",
            "phone": "03001234567",
            "father_name": "Father",
            "cnic_or_passport": "99999-9999999-9",
            "gender": "MALE",
            "training_site_ref": self.site.pk,
            "program_ref": self.prog.pk,
            "academic_session_ref": self.session.pk,
        }
        
        response = self.client.post(reverse("resident-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("department_ref", response.data)

        # Success when all provided
        payload["department_ref"] = self.dept.pk
        response = self.client.post(reverse("resident-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["identity_status"], "COMPLETE")

    def test_unmapped_resident_retrieval_incomplete_status(self):
        """Existing text-only profiles can be retrieved and show identity_status='INCOMPLETE'."""
        user = User.objects.create_user(
            username="old_resident",
            email="old_res@example.com",
            user_category="RESIDENT",
        )
        profile = ResidentProfile.objects.create(
            user=user,
            cnic_or_passport="88888-8888888-8",
            department_name="Urology",
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("resident-detail", args=[profile.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["identity_status"], "INCOMPLETE")

    def test_scoped_access_filtering(self):
        """SUPPORT_STAFF sees only residents in their scope training site."""
        # Resident in Allied Hospital (matching scope)
        user_in = User.objects.create_user(username="res_in", email="res_in@example.com", user_category="RESIDENT")
        ResidentProfile.objects.create(
            user=user_in,
            cnic_or_passport="11111-1111111-1",
            training_site_ref=self.site,
        )

        # Resident in another site (out of scope)
        from masters.models import TrainingSite
        other_site = TrainingSite.objects.create(name="FIC", code="FIC", institution=self.inst)
        user_out = User.objects.create_user(username="res_out", email="res_out@example.com", user_category="RESIDENT")
        ResidentProfile.objects.create(
            user=user_out,
            cnic_or_passport="22222-2222222-2",
            training_site_ref=other_site,
        )

        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(reverse("resident-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        usernames = [r["user"]["username"] for r in response.data]
        self.assertIn("res_in", usernames)
        self.assertNotIn("res_out", usernames)

