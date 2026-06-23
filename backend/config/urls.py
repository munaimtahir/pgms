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
from residents.views import ResidentViewSet
from supervisors.views import SupervisorViewSet
from masters.views import (
    InstitutionViewSet,
    TrainingSiteViewSet,
    DepartmentViewSet,
    ProgramViewSet,
    SpecialtyViewSet,
    DesignationViewSet,
    AcademicSessionViewSet,
    IdentityOptionsView,
)
from access.views import UserRoleAssignmentViewSet, MyScopeView


def health_view(_request):
    return JsonResponse(
        {
            "status": "ok",
            "service": "pgms-backend",
            "brick": "5",
        }
    )


router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("audit", AuditLogViewSet, basename="audit")
router.register("residents", ResidentViewSet, basename="resident")
router.register("supervisors", SupervisorViewSet, basename="supervisor")

# Masters registers
router.register("masters/institutions", InstitutionViewSet, basename="institution")
router.register("masters/training-sites", TrainingSiteViewSet, basename="training-site")
router.register("masters/departments", DepartmentViewSet, basename="department")
router.register("masters/programs", ProgramViewSet, basename="program")
router.register("masters/specialties", SpecialtyViewSet, basename="specialty")
router.register("masters/designations", DesignationViewSet, basename="designation")
router.register("masters/academic-sessions", AcademicSessionViewSet, basename="academic-session")

# Access registers
router.register("access/role-assignments", UserRoleAssignmentViewSet, basename="role-assignment")

urlpatterns = [
    path("api/health/", health_view, name="health-check"),
    path("api/auth/login/", CustomTokenObtainPairView.as_view(), name="auth-login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("api/auth/me/", MeView.as_view(), name="auth-me"),
    path("api/auth/complete-profile/", CompleteProfileView.as_view(), name="auth-complete-profile"),
    path("api/auth/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("api/identity/options/", IdentityOptionsView.as_view(), name="identity-options"),
    path("api/access/my-scope/", MyScopeView.as_view(), name="my-scope"),
    path("api/", include(router.urls)),
]


