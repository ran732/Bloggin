from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Blog, Comment, UserProfile, Bookmark, Follow
from .mailer import send_welcome_email


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = [
            "id",
            "blog",
            "author",
            "author_name",
            "content",
            "created_at",
        ]
        read_only_fields = ["id", "blog", "author", "created_at"]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["bio", "avatar_url", "website"]


class BlogSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(
        source="author.username",
        read_only=True
    )
    author_bio = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    comments_count = serializers.IntegerField(
        source="comments.count",
        read_only=True
    )
    comments = CommentSerializer(many=True, read_only=True)
    tag_list = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
    is_bookmarked = serializers.SerializerMethodField()
    is_following_author = serializers.SerializerMethodField()

    class Meta:
        model = Blog
        fields = [
            "id",
            "title",
            "content",
            "category",
            "tags",
            "tag_list",
            "author",
            "author_name",
            "author_bio",
            "author_avatar",
            "likes_count",
            "claps_count",
            "comments_count",
            "comments",
            "is_published",
            "is_bookmarked",
            "is_following_author",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "likes_count",
            "claps_count",
            "comments_count",
            "comments",
            "created_at",
            "updated_at",
        ]

    def get_author_bio(self, obj):
        try:
            return obj.author.profile.bio
        except Exception:
            return ""

    def get_author_avatar(self, obj):
        try:
            return obj.author.profile.avatar_url
        except Exception:
            return ""

    def get_is_bookmarked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Bookmark.objects.filter(user=request.user, blog=obj).exists()
        return False

    def get_is_following_author(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if request.user == obj.author:
                return False
            return Follow.objects.filter(follower=request.user, followed=obj.author).exists()
        return False

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value.strip()

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty.")
        return value.strip()


class BookmarkSerializer(serializers.ModelSerializer):
    blog_details = BlogSerializer(source="blog", read_only=True)

    class Meta:
        model = Bookmark
        fields = ["id", "blog", "blog_details", "created_at"]
        read_only_fields = ["id", "created_at"]


class AuthorProfileSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(source="profile.bio", default="")
    avatar_url = serializers.CharField(source="profile.avatar_url", default="")
    website = serializers.CharField(source="profile.website", default="")
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    stories_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "date_joined",
            "bio",
            "avatar_url",
            "website",
            "followers_count",
            "following_count",
            "stories_count",
            "is_following",
        ]

    def get_followers_count(self, obj):
        return obj.followers_set.count()

    def get_following_count(self, obj):
        return obj.following_set.count()

    def get_stories_count(self, obj):
        return obj.blogs.filter(is_published=True).count()

    def get_is_following(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if request.user == obj:
                return False
            return Follow.objects.filter(follower=request.user, followed=obj).exists()
        return False


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "date_joined", "profile", "followers_count", "following_count"]

    def get_followers_count(self, obj):
        return obj.followers_set.count()

    def get_following_count(self, obj):
        return obj.following_set.count()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_username(self, value):
        clean_value = value.strip()
        if not clean_value:
            raise serializers.ValidationError("Username cannot be empty.")
        if User.objects.filter(username__iexact=clean_value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return clean_value

    def validate_email(self, value):
        if value:
            clean_email = value.strip().lower()
            if User.objects.filter(email__iexact=clean_email).exists():
                raise serializers.ValidationError("A user with that email already exists.")
            return clean_email
        return ""

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        # Ensure profile exists
        UserProfile.objects.get_or_create(user=user)
        # Send welcome email if email is provided
        if user.email:
            send_welcome_email(user)
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=6)