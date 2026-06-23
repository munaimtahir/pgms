from __future__ import annotations

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from audit.models import AuditLog

User = get_user_model()


class AccountsAndAuditTests(APITestCase):
    def setUp(self):
        # Create UTRMC Admin
        self.admin_user = User.objects.create_superuser(
            username="admin",
            password="adminpassword",
            email="admin@example.com",
            full_name="System Administrator",
            phone="123456789",
        )
        
        # Create normal Resident user (temp password defaults to must_change_password=True)
        self.resident_user = User.objects.create_user(
            username="resident",
            password="temppassword",
            email="resident@example.com",
            full_name="",
            phone="",
        )
        
        # Credentials for JWT login
        self.login_url = reverse("auth-login")
        self.me_url = reverse("auth-me")
        self.change_password_url = reverse("auth-change-password")
        self.complete_profile_url = reverse("auth-complete-profile")
        self.user_list_url = reverse("user-list")

    def get_jwt_headers(self, username, password):
        response = self.client.post(self.login_url, {"username": username, "password": password})
        self.assertEqual(response.status_code, 200)
        access_token = response.data["access"]
        return {"HTTP_AUTHORIZATION": f"Bearer {access_token}"}

    def test_user_creation_and_defaults(self):
        """Test default flags for User models."""
        self.assertTrue(self.resident_user.must_change_password)
        self.assertFalse(self.resident_user.is_profile_complete)
        self.assertEqual(self.resident_user.user_category, "RESIDENT")
        
        # Superuser defaults
        self.assertFalse(self.admin_user.must_change_password)
        self.assertTrue(self.admin_user.is_profile_complete)
        self.assertEqual(self.admin_user.user_category, "UTRMC_ADMIN")

    def test_email_normalization(self):
        """Test that empty emails are normalized to None to avoid unique constraints."""
        user1 = User.objects.create_user(username="u1", email="")
        user2 = User.objects.create_user(username="u2", email="   ")
        
        self.assertIsNone(user1.email)
        self.assertIsNone(user2.email)

    def test_login_success_and_fail_audit_logs(self):
        """Test login success and failure logging."""
        # Success
        response = self.client.post(self.login_url, {"username": "admin", "password": "adminpassword"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["username"], "admin")
        
        success_log = AuditLog.objects.filter(action="LOGIN_SUCCESS").first()
        self.assertIsNotNone(success_log)
        self.assertEqual(success_log.actor, self.admin_user)

        # Failure
        response = self.client.post(self.login_url, {"username": "admin", "password": "wrongpassword"})
        self.assertEqual(response.status_code, 401)
        
        failed_log = AuditLog.objects.filter(action="LOGIN_FAILED").first()
        self.assertIsNotNone(failed_log)
        self.assertIsNone(failed_log.actor)
        self.assertEqual(failed_log.metadata["username"], "admin")

    def test_must_change_password_blocks_endpoints(self):
        """Verify user with must_change_password=True is restricted."""
        headers = self.get_jwt_headers("resident", "temppassword")
        
        # Access user list (blocked)
        response = self.client.get(self.user_list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Access complete profile (blocked because password change has priority)
        response = self.client.patch(self.complete_profile_url, {"full_name": "Test User"}, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Access change-password (allowed)
        response = self.client.post(
            self.change_password_url,
            {"old_password": "temppassword", "new_password": "newsecurepassword"},
            **headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh resident object from database and check must_change_password is False
        self.resident_user.refresh_from_db()
        self.assertFalse(self.resident_user.must_change_password)

    def test_incomplete_profile_blocks_endpoints(self):
        """Verify user with incomplete profile is restricted."""
        # 1. Change the password first so must_change_password is False but profile remains incomplete
        headers = self.get_jwt_headers("resident", "temppassword")
        response = self.client.post(
            self.change_password_url,
            {"old_password": "temppassword", "new_password": "newsecurepassword"},
            **headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Re-authenticate to get updated token
        headers = self.get_jwt_headers("resident", "newsecurepassword")
        
        # Access users list (blocked)
        response = self.client.get(self.user_list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Access complete profile (allowed)
        response = self.client.patch(
            self.complete_profile_url,
            {"full_name": "Resident Name", "phone": "03001234567", "email": "resident@example.com"},
            **headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.resident_user.refresh_from_db()
        self.assertTrue(self.resident_user.is_profile_complete)

    def test_admin_user_management(self):
        """Test UTRMC Admin CRUD operations and audit logging."""
        headers = self.get_jwt_headers("admin", "adminpassword")
        
        # List users
        response = self.client.get(self.user_list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # admin and resident
        
        # Create user
        create_payload = {
            "username": "newsupportstaff",
            "email": "support@example.com",
            "full_name": "Support Staff Member",
            "phone": "987654321",
            "user_category": "SUPPORT_STAFF",
        }
        response = self.client.post(self.user_list_url, create_payload, **headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        new_user = User.objects.get(username="newsupportstaff")
        self.assertTrue(new_user.must_change_password)
        self.assertFalse(new_user.is_profile_complete)
        
        # Check audit log for user creation
        log = AuditLog.objects.filter(action="USER_CREATED").first()
        self.assertIsNotNone(log)
        self.assertEqual(log.actor, self.admin_user)
        self.assertEqual(log.target_id, str(new_user.pk))
        
        # Reset password
        reset_url = reverse("user-reset-password", args=[new_user.pk])
        response = self.client.post(reset_url, {"new_password": "supernewpassword"}, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        log = AuditLog.objects.filter(action="PASSWORD_RESET_BY_ADMIN").first()
        self.assertIsNotNone(log)
        
        # Deactivate user
        detail_url = reverse("user-detail", args=[new_user.pk])
        response = self.client.patch(detail_url, {"is_active": False}, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        log = AuditLog.objects.filter(action="USER_DEACTIVATED").first()
        self.assertIsNotNone(log)

    def test_non_admin_cannot_access_user_management(self):
        """Verify normal users cannot perform user management operations."""
        headers = self.get_jwt_headers("resident", "temppassword")
        
        # Even if they change password and complete profile, they should still be blocked from users list
        # 1. Change password
        self.client.post(
            self.change_password_url,
            {"old_password": "temppassword", "new_password": "newsecurepassword"},
            **headers
        )
        headers = self.get_jwt_headers("resident", "newsecurepassword")
        
        # 2. Complete profile
        self.client.patch(
            self.complete_profile_url,
            {"full_name": "Resident Name", "phone": "03001234567", "email": "resident@example.com"},
            **headers
        )
        
        # Now fully active, but user_category is RESIDENT
        response = self.client.get(self.user_list_url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try to post/create user (blocked)
        response = self.client.post(self.user_list_url, {"username": "hacker"}, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
