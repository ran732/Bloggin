import uuid
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q, F
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.authtoken.models import Token

from .models import Blog, Comment, Bookmark, Follow, PasswordResetToken, UserProfile
from .serializers import (
    BlogSerializer,
    CommentSerializer,
    UserSerializer,
    UserProfileSerializer,
    RegisterSerializer,
    BookmarkSerializer,
    AuthorProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from .permissions import IsAuthorOrReadOnly
from .mailer import send_password_reset_email, send_new_follower_email


# ---------------------------------------------------------
# BLOG VIEWS (CRUD & FEEDS)
# ---------------------------------------------------------

class BlogListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/blogs/ -> List published blogs (Supports ?search=, ?category=, and ?tag=)
    POST /api/v1/blogs/ -> Create a new blog (Authenticated users only)
    """
    serializer_class = BlogSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = Blog.objects.filter(is_published=True).order_by("-created_at")

        # Search filter
        search = self.request.query_params.get("search", None)
        if search and search.strip():
            q = search.strip()
            queryset = queryset.filter(
                Q(title__icontains=q)
                | Q(content__icontains=q)
                | Q(tags__icontains=q)
                | Q(author__username__icontains=q)
            )

        # Category filter
        category = self.request.query_params.get("category", None)
        if category and category.strip() and category.strip().lower() != "all":
            queryset = queryset.filter(category__iexact=category.strip())

        # Tag filter
        tag = self.request.query_params.get("tag", None)
        if tag and tag.strip():
            clean_tag = tag.strip().lstrip("#")
            queryset = queryset.filter(tags__icontains=clean_tag)

        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class BlogDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/blogs/<pk>/ -> Retrieve blog details (Public if published, Author if draft)
    PUT    /api/v1/blogs/<pk>/ -> Update blog (Author only)
    PATCH  /api/v1/blogs/<pk>/ -> Partial update blog (Author only)
    DELETE /api/v1/blogs/<pk>/ -> Delete blog (Author only)
    """
    serializer_class = BlogSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Blog.objects.filter(Q(is_published=True) | Q(author=user))
        return Blog.objects.filter(is_published=True)


class MyBlogsListView(generics.ListAPIView):
    """
    GET /api/v1/my-blogs/ -> Returns all posts by the logged-in user (published + drafts)
    """
    serializer_class = BlogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Blog.objects.filter(author=self.request.user).order_by("-created_at")


class FollowingFeedView(generics.ListAPIView):
    """
    GET /api/v1/blogs/following/ -> Medium-style personalized feed of followed authors
    """
    serializer_class = BlogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        following_user_ids = self.request.user.following_set.values_list("followed_id", flat=True)
        return Blog.objects.filter(author_id__in=following_user_ids, is_published=True).order_by("-created_at")


class BlogLikeView(APIView):
    """
    POST /api/v1/blogs/<pk>/like/ -> Atomically increments the like counter
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        blog = get_object_or_404(Blog, pk=pk, is_published=True)
        Blog.objects.filter(pk=pk).update(
            likes_count=F("likes_count") + 1,
            claps_count=F("claps_count") + 1
        )
        blog.refresh_from_db(fields=["likes_count", "claps_count"])
        return Response(
            {"likes_count": blog.likes_count, "claps_count": blog.claps_count},
            status=status.HTTP_200_OK
        )


class BlogClapView(APIView):
    """
    POST /api/v1/blogs/<pk>/clap/ -> Medium-style clap mechanism (supports 1 to 50 claps per burst)
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        blog = get_object_or_404(Blog, pk=pk, is_published=True)
        try:
            claps_to_add = int(request.data.get("count", 1))
            claps_to_add = max(1, min(claps_to_add, 50))
        except (ValueError, TypeError):
            claps_to_add = 1

        Blog.objects.filter(pk=pk).update(
            claps_count=F("claps_count") + claps_to_add,
            likes_count=F("likes_count") + claps_to_add
        )
        blog.refresh_from_db(fields=["claps_count", "likes_count"])
        return Response(
            {
                "claps_count": blog.claps_count,
                "likes_count": blog.likes_count,
                "added": claps_to_add
            },
            status=status.HTTP_200_OK
        )


class CommentCreateView(generics.CreateAPIView):
    """
    POST /api/v1/blogs/<pk>/comments/ -> Add comment to published blog
    """
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        blog = get_object_or_404(Blog, pk=self.kwargs["pk"], is_published=True)
        user = self.request.user if self.request.user.is_authenticated else None
        author_name = self.request.data.get("author_name")

        if user:
            author_name = user.username
        elif not author_name or not str(author_name).strip():
            author_name = "Reader"

        serializer.save(blog=blog, author=user, author_name=str(author_name).strip())


# ---------------------------------------------------------
# MEDIUM BOOKMARK / READING LIST VIEWS
# ---------------------------------------------------------

class BookmarkToggleView(APIView):
    """
    POST /api/v1/blogs/<pk>/bookmark/ -> Toggles story in user's Reading List
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        blog = get_object_or_404(Blog, pk=pk, is_published=True)
        bookmark = Bookmark.objects.filter(user=request.user, blog=blog).first()

        if bookmark:
            bookmark.delete()
            return Response(
                {"is_bookmarked": False, "message": "Story removed from your Reading List."},
                status=status.HTTP_200_OK,
            )
        else:
            Bookmark.objects.create(user=request.user, blog=blog)
            return Response(
                {"is_bookmarked": True, "message": "Story saved to your Reading List."},
                status=status.HTTP_201_CREATED,
            )


class BookmarkListView(generics.ListAPIView):
    """
    GET /api/v1/bookmarks/ -> Retrieves all stories in user's Reading List
    """
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).select_related("blog", "blog__author")


# ---------------------------------------------------------
# MEDIUM AUTHOR PROFILES & SOCIAL FOLLOW VIEWS
# ---------------------------------------------------------

class AuthorProfileView(generics.RetrieveAPIView):
    """
    GET /api/v1/authors/<username>/ -> Public Medium author profile
    """
    queryset = User.objects.all()
    serializer_class = AuthorProfileSerializer
    permission_classes = [AllowAny]
    lookup_field = "username"


class FollowToggleView(APIView):
    """
    POST /api/v1/authors/<username>/follow/ -> Follow or Unfollow an author
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        target_author = get_object_or_404(User, username__iexact=username)
        if target_author == request.user:
            return Response(
                {"error": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        relation = Follow.objects.filter(follower=request.user, followed=target_author).first()
        if relation:
            relation.delete()
            is_following = False
        else:
            Follow.objects.create(follower=request.user, followed=target_author)
            is_following = True
            send_new_follower_email(request.user, target_author)

        followers_count = target_author.followers_set.count()
        return Response(
            {
                "is_following": is_following,
                "followers_count": followers_count,
                "message": f"You are {'now following' if is_following else 'no longer following'} {target_author.username}."
            },
            status=status.HTTP_200_OK,
        )


class UserProfileUpdateView(APIView):
    """
    PATCH /api/v1/auth/profile/ -> Update logged-in user's Bio, Avatar, and Website
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Profile updated successfully.",
                    "profile": serializer.data,
                    "user": UserSerializer(request.user, context={"request": request}).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------
# AUTHENTICATION & PASSWORD RESET VIEWS
# ---------------------------------------------------------

class RegisterView(APIView):
    """
    POST /api/v1/auth/register/
    Payload: { "username": "...", "email": "...", "password": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    "message": "User registered successfully. Welcome email dispatched!",
                    "token": token.key,
                    "user": UserSerializer(user, context={"request": request}).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Payload: { "username": "...", "password": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Please provide both username and password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=username, password=password)
        if not user or not user.is_active:
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "message": "Login successful",
                "token": token.key,
                "user": UserSerializer(user, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )


class CurrentUserView(APIView):
    """
    GET /api/v1/auth/me/
    Header: Authorization: Token <key>
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Header: Authorization: Token <key>
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """
    POST /api/v1/auth/password-reset/
    Payload: { "email": "user@example.com" }
    Dispatches a reset link via email
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if user:
            # Invalidate older tokens
            PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

            reset_obj = PasswordResetToken.objects.create(
                user=user,
                token=str(uuid.uuid4())
            )
            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
            reset_url = f"{frontend_url}/reset-password?token={reset_obj.token}"

            send_password_reset_email(user, reset_url)

        # Standard security practice: return same response whether email exists or not
        return Response(
            {
                "message": "If this email is registered in our system, a password reset link has been dispatched to it."
            },
            status=status.HTTP_200_OK
        )


class PasswordResetVerifyTokenView(APIView):
    """
    GET /api/v1/auth/password-reset/verify/?token=...
    Checks if a token is valid before rendering reset password form
    """
    permission_classes = [AllowAny]

    def get(self, request):
        token_str = request.query_params.get("token")
        if not token_str:
            return Response({"valid": False, "error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

        reset_token = PasswordResetToken.objects.filter(token=token_str).first()
        if not reset_token or not reset_token.is_valid():
            return Response(
                {"valid": False, "error": "This password reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "valid": True,
                "username": reset_token.user.username
            },
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    """
    POST /api/v1/auth/password-reset/confirm/
    Payload: { "token": "...", "new_password": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_str = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        reset_token = PasswordResetToken.objects.filter(token=token_str).first()
        if not reset_token or not reset_token.is_valid():
            return Response(
                {"error": "This password reset link has expired or has already been used."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update password
        user = reset_token.user
        user.set_password(new_password)
        user.save()

        # Mark token as consumed
        reset_token.is_used = True
        reset_token.save(update_fields=["is_used"])

        # Invalidate any active session/tokens so user logs in with new password
        Token.objects.filter(user=user).delete()

        return Response(
            {
                "message": "Password updated successfully. You can now sign in with your new credentials."
            },
            status=status.HTTP_200_OK
        )
