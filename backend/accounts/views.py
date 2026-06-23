from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.permissions import EnforceUserStatusPermission, IsUtrmcAdmin
from accounts.serializers import (
    ChangePasswordSerializer,
    CompleteProfileSerializer,
    ResetPasswordSerializer,
    UserCreateSerializer,
    UserSerializer,
)
from audit.utils import log_audit

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Subclass TokenObtainPairView to return full user state and audit logs.
    """

    def post(self, request, *args, **kwargs) -> Response:
        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == 200:
                username = request.data.get("username", "")
                try:
                    user = User.objects.get(username=username)
                    user_data = UserSerializer(user).data
                    response.data["user"] = user_data
                    
                    log_audit(
                        action="LOGIN_SUCCESS",
                        request=request,
                        actor=user,
                        target_model="accounts.User",
                        target_id=user.pk,
                        metadata={"username": username},
                    )
                except User.DoesNotExist:
                    pass
            return response
        except Exception as e:
            username = request.data.get("username", "")
            log_audit(
                action="LOGIN_FAILED",
                request=request,
                actor=None,
                target_model="accounts.User",
                metadata={"username": username, "error": str(e)},
            )
            raise


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated, EnforceUserStatusPermission]

    def post(self, request) -> Response:
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                log_audit(
                    action="LOGOUT",
                    request=request,
                    actor=request.user,
                    target_model="accounts.User",
                    target_id=request.user.pk,
                )
                return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
            return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated, EnforceUserStatusPermission]

    def get(self, request) -> Response:
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CompleteProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated, EnforceUserStatusPermission]

    def patch(self, request) -> Response:
        user = request.user
        serializer = CompleteProfileSerializer(
            user, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            before = {
                "full_name": user.full_name,
                "phone": user.phone,
                "email": user.email,
                "is_profile_complete": user.is_profile_complete,
            }
            updated_user = serializer.save()
            after = {
                "full_name": updated_user.full_name,
                "phone": updated_user.phone,
                "email": updated_user.email,
                "is_profile_complete": updated_user.is_profile_complete,
            }
            log_audit(
                action="PROFILE_COMPLETED",
                request=request,
                actor=updated_user,
                target_model="accounts.User",
                target_id=updated_user.pk,
                before=before,
                after=after,
            )
            return Response(UserSerializer(updated_user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated, EnforceUserStatusPermission]

    def post(self, request) -> Response:
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            user = serializer.save()
            log_audit(
                action="PASSWORD_CHANGED",
                request=request,
                actor=user,
                target_model="accounts.User",
                target_id=user.pk,
            )
            return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admins to manage users (create, list, view, update, deactivate, reset password).
    """

    queryset = User.objects.all().order_by("-created_at")
    permission_classes = [IsUtrmcAdmin, EnforceUserStatusPermission]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        log_audit(
            action="USER_CREATED",
            request=self.request,
            actor=self.request.user,
            target_model="accounts.User",
            target_id=user.pk,
            after=UserSerializer(user).data,
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        before = UserSerializer(instance).data
        old_active = instance.is_active

        user = serializer.save()
        after = UserSerializer(user).data

        if old_active and not user.is_active:
            log_audit(
                action="USER_DEACTIVATED",
                request=self.request,
                actor=self.request.user,
                target_model="accounts.User",
                target_id=user.pk,
                before=before,
                after=after,
            )
        elif not old_active and user.is_active:
            log_audit(
                action="USER_ACTIVATED",
                request=self.request,
                actor=self.request.user,
                target_model="accounts.User",
                target_id=user.pk,
                before=before,
                after=after,
            )
        else:
            log_audit(
                action="USER_UPDATED",
                request=self.request,
                actor=self.request.user,
                target_model="accounts.User",
                target_id=user.pk,
                before=before,
                after=after,
            )

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None) -> Response:
        user = self.get_object()
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user)
            log_audit(
                action="PASSWORD_RESET_BY_ADMIN",
                request=request,
                actor=request.user,
                target_model="accounts.User",
                target_id=user.pk,
            )
            return Response(
                {"message": f"Password reset successfully for user {user.username}."},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
