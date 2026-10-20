"""
URL configuration for Bloggin project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root_view(request):
    return JsonResponse({
        "status": "online",
        "service": "Bloggin REST API",
        "version": "v1",
        "docs": "https://github.com/",
        "endpoints": {
            "blogs": "/api/v1/blogs/",
            "my_blogs": "/api/v1/blogs/my-blogs/",
            "bookmarks": "/api/v1/blogs/bookmarks/",
            "following_feed": "/api/v1/blogs/following/",
            "register": "/api/v1/auth/register/",
            "login": "/api/v1/auth/login/",
            "current_user": "/api/v1/auth/me/",
            "logout": "/api/v1/auth/logout/",
            "profile_update": "/api/v1/auth/profile/",
            "password_reset": "/api/v1/auth/password-reset/",
            "admin": "/admin/",
        }
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", api_root_view, name="api-root"),
    path("api/", api_root_view, name="api-root-base"),
    path("api/v1/", api_root_view, name="api-root-v1"),
    path("api/v1/blogs/", include("blogs.urls")),
    path("api/blogs/", include("blogs.urls")),
    # Backwards-compatible / convenience routes
    path("api/v1/auth/", include("blogs.auth_urls")),
    path("api/auth/", include("blogs.auth_urls")),
]

