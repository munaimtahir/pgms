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
from supervisors.models import SupervisorProfile
from supervisors.services import create_supervisor_with_user, validate_supervisor_uniqueness
from access.models import UserRoleAssignment

User = get_user_model()


class SupervisorModelTests(TestCase):
    def setUp(self):
        self.supervisor_user = User.objects.create_user(
            username="sup1",
            email="sup1@example.com",
            user_category="SUPERVISOR",
        )
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
        )

    def test_supervisor_profile_cannot_exist_without_user(self):
        """Test that profile cannot be saved without a linked User."""
        profile = SupervisorProfile(
            pmdc_number="12345-S",
        )
        with self.assertRaises(Exception):
            profile.save()

    def test_supervisor_profile_cannot_link_to_non_supervisor_user(self):
        """Test validation error if linking to non-SUPERVISOR user."""
        profile = SupervisorProfile(
            user=self.admin_user,
            pmdc_number="12345-S",
        )
        with self.assertRaises(ValidationError) as ctx:
            profile.save()
        self.assertIn("Linked User must have user_category='SUPERVISOR'", str(ctx.exception))

    def test_phone_normalization_on_save(self):
        """Verify phone numbers are normalized to digits and plus signs."""
        profile = SupervisorProfile(
            user=self.supervisor_user,
            pmdc_number="12345-S",
            primary_office_phone="+92 (300) 111-2222",
            alternate_phone="0300 111 2222",
        )
        profile.save()
        self.assertEqual(profile.primary_office_phone_normalized, "+923001112222")
        self.assertEqual(profile.alternate_phone_normalized, "03001112222")


class SupervisorServiceTests(TestCase):
    def setUp(self):
        pass

    def test_create_supervisor_with_user_success(self):
        """Verify atomic user and profile creation."""
        user_data = {
            "username": "supervisor_service",
            "email": "service_sup@example.com",
            "full_name": "Service Supervisor",
            "phone": "03008889999",
            "password": "securepassword123",
        }
        profile_data = {
            "pmdc_number": "88888-S",
            "designation": "Associate Professor",
            "specialty_name": "Surgery",
            "institution_name": "FMU",
            "department_name": "General Surgery",
        }

        profile = create_supervisor_with_user(user_data, profile_data)
        
        self.assertIsNotNone(profile)
        self.assertEqual(profile.user.username, "supervisor_service")
        self.assertEqual(profile.user.user_category, "SUPERVISOR")
        self.assertTrue(profile.user.must_change_password)
        self.assertEqual(profile.pmdc_number, "88888-S")
        self.assertEqual(profile.official_email, "service_sup@example.com")

        # Verify audit logs
        user_log = AuditLog.objects.filter(action="USER_CREATED", target_id=profile.user.pk).first()
        profile_log = AuditLog.objects.filter(action="SUPERVISOR_CREATED", target_id=profile.pk).first()
        
        self.assertIsNotNone(user_log)
        self.assertIsNotNone(profile_log)

    def test_create_supervisor_with_user_rollback_on_profile_failure(self):
        """Ensure User creation is rolled back if profile creation fails."""
        user_data = {
            "username": "supervisor_rollback",
            "email": "sup_rollback@example.com",
            "full_name": "Rollback Supervisor",
            "phone": "03008888888",
        }
        profile_data = {
            "pmdc_number": "11111-S",
        }

        # Mock SupervisorProfile.save to fail
        with patch.object(SupervisorProfile, "save", side_effect=ValidationError("Mock save error")):
            with self.assertRaises(ValidationError):
                create_supervisor_with_user(user_data, profile_data)

        # Assert User was not created
        self.assertFalse(User.objects.filter(username="supervisor_rollback").exists())

    def test_duplicate_checks(self):
        """Test validate_supervisor_uniqueness raises ValidationError on duplicates."""
        # Setup one supervisor
        user_data = {
            "username": "unique_sup",
            "email": "dup_sup@example.com",
            "full_name": "Unique Supervisor",
            "phone": "03001111111",
        }
        profile_data = {
            "pmdc_number": "11111-S",
        }
        create_supervisor_with_user(user_data, profile_data)

        # Check duplicate username
        with self.assertRaises(ValidationError) as ctx:
            validate_supervisor_uniqueness("unique_sup", "other@example.com", "22222-S")
        self.assertIn("username", ctx.exception.message_dict)

        # Check duplicate email
        with self.assertRaises(ValidationError) as ctx:
            validate_supervisor_uniqueness("other_sup", "dup_sup@example.com", "22222-S")
        self.assertIn("email", ctx.exception.message_dict)

        # Check duplicate PMDC
        with self.assertRaises(ValidationError) as ctx:
            validate_supervisor_uniqueness("other_sup", "other@example.com", "11111-S")
        self.assertIn("pmdc_number", ctx.exception.message_dict)


class SupervisorAPIPermissionTests(APITestCase):
    def setUp(self):
        # Create users for all categories
        self.admin = User.objects.create_superuser(username="admin_api_sup", password="password")
        self.support = User.objects.create_user(username="support_api_sup", password="password", user_category="SUPPORT_STAFF", is_profile_complete=True, must_change_password=False)
        self.resident = User.objects.create_user(username="resident_api_sup", password="password", user_category="RESIDENT", is_profile_complete=True, must_change_password=False)
        
        # Setup master metadata
        from masters.models import Institution, TrainingSite, Department, Designation
        self.inst = Institution.objects.create(name="FMU", code="FMU")
        self.site = TrainingSite.objects.create(name="Allied Hospital", code="AH", institution=self.inst)
        self.dept = Department.objects.create(name="Cardiology", code="CARD", training_site=self.site)
        self.desig = Designation.objects.create(name="Professor", code="PROF")

        # Setup support staff scope
        UserRoleAssignment.objects.create(
            user=self.support,
            role=UserRoleAssignment.Role.SUPPORT_STAFF_ACCESS,
            scope_type=UserRoleAssignment.ScopeType.GLOBAL,
        )

        # Create a supervisor with profile
        user_data = {
            "username": "supervisor_api",
            "email": "sup_api@example.com",
            "full_name": "API Supervisor",
            "phone": "03001234567",
            "password": "password",
        }
        profile_data = {
            "pmdc_number": "12345-S",
            "designation": "Professor",
            "training_site_ref": self.site,
            "department_ref": self.dept,
            "designation_ref": self.desig,
        }
        self.supervisor_profile = create_supervisor_with_user(user_data, profile_data)
        self.supervisor_user = self.supervisor_profile.user
        
        # Make supervisor bypass password change and complete profile gates for tests
        self.supervisor_user.must_change_password = False
        self.supervisor_user.is_profile_complete = True
        self.supervisor_user.save()

        # Endpoint URL
        self.list_url = reverse("supervisor-list")
        self.detail_url = reverse("supervisor-detail", args=[self.supervisor_profile.pk])
        self.unarchive_url = reverse("supervisor-unarchive", args=[self.supervisor_profile.pk])
        self.duplicate_check_url = reverse("supervisor-check-duplicates")
        self.login_url = reverse("auth-login")

    def get_headers(self, username, password="password"):
        response = self.client.post(self.login_url, {"username": username, "password": password})
        self.assertEqual(response.status_code, 200)
        return {"HTTP_AUTHORIZATION": f"Bearer {response.data['access']}"}

    def test_utrmc_admin_permissions(self):
        """UTRMC Admin can perform all operations, archive/unarchive."""
        headers = self.get_headers("admin_api_sup")

        # Browse list
        response = self.client.get(self.list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Create
        create_payload = {
            "username": "new_sup_api",
            "email": "new_sup_api@example.com",
            "full_name": "New API Supervisor",
            "phone": "03009876543",
            "pmdc_number": "99999-S",
            "training_site_ref": self.site.pk,
            "department_ref": self.dept.pk,
            "designation_ref": self.desig.pk,
        }
        response = self.client.post(self.list_url, create_payload, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        new_sup = SupervisorProfile.objects.get(pmdc_number="99999-S")

        # Archive (Soft delete)
        detail_url = reverse("supervisor-detail", args=[new_sup.pk])
        response = self.client.delete(detail_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        new_sup.refresh_from_db()
        self.assertTrue(new_sup.is_archived)
        self.assertFalse(new_sup.user.is_active)

        # Unarchive
        unarchive_url = reverse("supervisor-unarchive", args=[new_sup.pk])
        response = self.client.post(unarchive_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        new_sup.refresh_from_db()
        self.assertFalse(new_sup.is_archived)
        self.assertTrue(new_sup.user.is_active)

    def test_support_staff_permissions(self):
        """Support staff can view, but CANNOT create, update or archive supervisors."""
        headers = self.get_headers("support_api_sup")

        # View List
        response = self.client.get(self.list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # View Detail
        response = self.client.get(self.detail_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Create (Should fail)
        create_payload = {
            "username": "support_created_sup",
            "email": "support_created_sup@example.com",
            "full_name": "Support Created",
            "phone": "03001112222",
        }
        response = self.client.post(self.list_url, create_payload, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Update (Should fail)
        response = self.client.patch(self.detail_url, {"designation": "Support Edit"}, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Archive (Should fail)
        response = self.client.delete(self.detail_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_supervisor_self_access_only(self):
        """Supervisor can view and edit own profile only. Cannot view list."""
        headers = self.get_headers("supervisor_api")

        # List is blocked
        response = self.client.get(self.list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # View own detail is allowed
        response = self.client.get(self.detail_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Update own detail is allowed
        response = self.client.patch(self.detail_url, {"room_or_office": "Room 501"}, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supervisor_profile.refresh_from_db()
        self.assertEqual(self.supervisor_profile.room_or_office, "Room 501")

        # View another supervisor's profile (should be 404 or filtered out)
        other_user = User.objects.create_user(username="other_sup_api", user_category="SUPERVISOR")
        other_profile = SupervisorProfile.objects.create(
            user=other_user,
            pmdc_number="88888-Other",
        )
        other_detail_url = reverse("supervisor-detail", args=[other_profile.pk])
        
        response = self.client.get(other_detail_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_resident_is_blocked_completely(self):
        """Residents are completely blocked from accessing the supervisor directory."""
        headers = self.get_headers("resident_api_sup")

        # List is blocked
        response = self.client.get(self.list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Detail is blocked
        response = self.client.get(self.detail_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_check_api(self):
        """Test check-duplicates API endpoint."""
        headers = self.get_headers("admin_api_sup")

        payload = {
            "username": "supervisor_api",  # duplicate
            "email": "sup_api@example.com",  # duplicate
            "pmdc_number": "12345-S",  # duplicate
        }
        response = self.client.post(self.duplicate_check_url, payload, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["has_duplicates"])
        self.assertIn("username", response.data["duplicates"])
        self.assertIn("email", response.data["duplicates"])
        self.assertIn("pmdc_number", response.data["duplicates"])
