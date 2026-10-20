from django.urls import path
from .views import (
    BlogListCreateView,
    BlogDetailView,
    MyBlogsListView,
    FollowingFeedView,
    BlogLikeView,
    BlogClapView,
    CommentCreateView,
    BookmarkToggleView,
    BookmarkListView,
    AuthorProfileView,
    FollowToggleView,
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
    # Blogs CRUD
    path("", BlogListCreateView.as_view(), name="blog-list-create"),
    path("<int:pk>/", BlogDetailView.as_view(), name="blog-detail"),
    path("<int:pk>/like/", BlogLikeView.as_view(), name="blog-like"),
    path("<int:pk>/clap/", BlogClapView.as_view(), name="blog-clap"),
    path("<int:pk>/comments/", CommentCreateView.as_view(), name="comment-create"),
    path("<int:pk>/bookmark/", BookmarkToggleView.as_view(), name="bookmark-toggle"),
    path("bookmarks/", BookmarkListView.as_view(), name="bookmarks-list"),
    path("following/", FollowingFeedView.as_view(), name="following-feed"),
    path("my-blogs/", MyBlogsListView.as_view(), name="my-blogs"),

    # Medium Authors & Follow
    path("authors/<str:username>/", AuthorProfileView.as_view(), name="author-profile"),
    path("authors/<str:username>/follow/", FollowToggleView.as_view(), name="author-follow"),

    # Authentication & Password Reset (under /api/v1/blogs/auth/ for legacy/convenience)
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/me/", CurrentUserView.as_view(), name="auth-me"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/profile/", UserProfileUpdateView.as_view(), name="auth-profile"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("auth/password-reset/verify/", PasswordResetVerifyTokenView.as_view(), name="auth-password-reset-verify"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
]
