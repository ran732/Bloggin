from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    CurrentUserView,
    LogoutView,
    UserProfileUpdateView,
    PasswordResetRequestView,
    PasswordResetVerifyTokenView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register-direct"),
    path("login/", LoginView.as_view(), name="auth-login-direct"),
    path("me/", CurrentUserView.as_view(), name="auth-me-direct"),
    path("logout/", LogoutView.as_view(), name="auth-logout-direct"),
    path("profile/", UserProfileUpdateView.as_view(), name="auth-profile-direct"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset-direct"),
    path("password-reset/verify/", PasswordResetVerifyTokenView.as_view(), name="auth-password-reset-verify-direct"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm-direct"),
]
