from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    CustomTokenObtainPairView,
    LogoutView,
    MeView,
    CompleteProfileView,
    ChangePasswordView,
    UserViewSet,
)
from audit.views import AuditLogViewSet


def health_view(_request):
    return JsonResponse(
        {
            "status": "ok",
            "service": "pgms-backend",
            "brick": "1",
        }
    )


router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("audit", AuditLogViewSet, basename="audit")

urlpatterns = [
    path("api/health/", health_view, name="health-check"),
    path("api/auth/login/", CustomTokenObtainPairView.as_view(), name="auth-login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("api/auth/me/", MeView.as_view(), name="auth-me"),
    path("api/auth/complete-profile/", CompleteProfileView.as_view(), name="auth-complete-profile"),
    path("api/auth/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("api/", include(router.urls)),
]

