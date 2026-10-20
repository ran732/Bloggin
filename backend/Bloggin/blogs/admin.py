from django.contrib import admin
from .models import Blog, Comment, UserProfile, Follow, Bookmark, PasswordResetToken


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "bio", "website", "created_at")
    search_fields = ("user__username", "user__email", "bio")


@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "category", "tags", "claps_count", "likes_count", "is_published", "created_at")
    list_filter = ("is_published", "category", "created_at", "author")
    search_fields = ("title", "content", "tags", "author__username")
    ordering = ("-created_at",)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "blog", "author_name", "created_at")
    list_filter = ("created_at",)
    search_fields = ("author_name", "content", "blog__title")
    ordering = ("-created_at",)


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("id", "follower", "followed", "created_at")
    search_fields = ("follower__username", "followed__username")
    ordering = ("-created_at",)


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "blog", "created_at")
    search_fields = ("user__username", "blog__title")
    ordering = ("-created_at",)


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "token", "is_used", "created_at")
    list_filter = ("is_used", "created_at")
    search_fields = ("user__username", "user__email", "token")
    ordering = ("-created_at",)
