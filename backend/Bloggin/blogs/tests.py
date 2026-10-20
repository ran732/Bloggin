from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from .models import Blog, Comment


class BlogginAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create author 1
        self.user1 = User.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="password123",
        )
        self.token1 = Token.objects.create(user=self.user1)

        # Create author 2
        self.user2 = User.objects.create_user(
            username="bob",
            email="bob@example.com",
            password="password456",
        )
        self.token2 = Token.objects.create(user=self.user2)

        # Create sample blogs
        self.published_blog = Blog.objects.create(
            title="Understanding React 19",
            content="React 19 brings exciting new features including server actions.",
            category="Web Development",
            author=self.user1,
            is_published=True,
            likes_count=5,
        )

        self.draft_blog = Blog.objects.create(
            title="Unfinished Thoughts on AI",
            content="Draft notes on autonomous agents and LLMs.",
            category="Technology",
            author=self.user1,
            is_published=False,
        )

        self.bobs_blog = Blog.objects.create(
            title="Python Clean Code",
            content="How to write clean and maintainable Python code.",
            category="Programming",
            author=self.user2,
            is_published=True,
        )

    # -------------------------------------------------------------
    # Authentication Tests
    # -------------------------------------------------------------
    def test_register_success(self):
        payload = {
            "username": "charlie",
            "email": "charlie@example.com",
            "password": "strongpassword",
        }
        response = self.client.post("/api/v1/auth/register/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["username"], "charlie")
        self.assertTrue(User.objects.filter(username="charlie").exists())

    def test_register_duplicate_username(self):
        payload = {
            "username": "alice",
            "email": "another@example.com",
            "password": "password123",
        }
        response = self.client.post("/api/v1/auth/register/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_register_short_password(self):
        payload = {
            "username": "david",
            "password": "123",
        }
        response = self.client.post("/api/v1/auth/register/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_login_success(self):
        payload = {
            "username": "alice",
            "password": "password123",
        }
        response = self.client.post("/api/v1/auth/login/", payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["token"], self.token1.key)
        self.assertEqual(response.data["user"]["username"], "alice")

    def test_login_invalid_password(self):
        payload = {
            "username": "alice",
            "password": "wrongpassword",
        }
        response = self.client.post("/api/v1/auth/login/", payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_current_user_authenticated(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "alice")

    def test_get_current_user_unauthenticated(self):
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")
        response = self.client.post("/api/v1/auth/logout/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(key=self.token1.key).exists())

    # -------------------------------------------------------------
    # Blog List & Filtering Tests
    # -------------------------------------------------------------
    def test_list_published_blogs_only(self):
        response = self.client.get("/api/v1/blogs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [b["title"] for b in response.data]
        self.assertIn("Understanding React 19", titles)
        self.assertIn("Python Clean Code", titles)
        # Drafts should NOT be in the public list
        self.assertNotIn("Unfinished Thoughts on AI", titles)

    def test_search_blogs_by_title(self):
        response = self.client.get("/api/v1/blogs/?search=React")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Understanding React 19")

    def test_search_blogs_by_author(self):
        response = self.client.get("/api/v1/blogs/?search=bob")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Python Clean Code")

    def test_filter_blogs_by_category(self):
        response = self.client.get("/api/v1/blogs/?category=Programming")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Python Clean Code")

    # -------------------------------------------------------------
    # Blog Creation Tests
    # -------------------------------------------------------------
    def test_create_blog_authenticated(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")
        payload = {
            "title": "Django REST Tips",
            "content": "Use generic views for fast development.",
            "category": "Technology",
            "is_published": True,
        }
        response = self.client.post("/api/v1/blogs/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["author_name"], "alice")
        self.assertEqual(response.data["title"], "Django REST Tips")

    def test_create_blog_unauthenticated_fails(self):
        payload = {
            "title": "Anonymous Attempt",
            "content": "Should be rejected.",
            "category": "Technology",
        }
        response = self.client.post("/api/v1/blogs/", payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------------------------------------------
    # Blog Detail & Draft Protection Tests
    # -------------------------------------------------------------
    def test_public_can_view_published_blog(self):
        response = self.client.get(f"/api/v1/blogs/{self.published_blog.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], self.published_blog.title)

    def test_public_cannot_view_draft_blog(self):
        response = self.client.get(f"/api/v1/blogs/{self.draft_blog.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_author_can_view_own_draft_blog(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")
        response = self.client.get(f"/api/v1/blogs/{self.draft_blog.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], self.draft_blog.title)

    def test_other_user_cannot_view_draft_blog(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token2.key}")
        response = self.client.get(f"/api/v1/blogs/{self.draft_blog.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -------------------------------------------------------------
    # Blog Update and Delete Permissions Tests
    # -------------------------------------------------------------
    def test_author_can_update_blog(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")
        payload = {"title": "React 19 Deep Dive"}
        response = self.client.patch(f"/api/v1/blogs/{self.published_blog.id}/", payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.published_blog.refresh_from_db()
        self.assertEqual(self.published_blog.title, "React 19 Deep Dive")

    def test_non_author_cannot_update_blog(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token2.key}")
        payload = {"title": "Hacked Title"}
        response = self.client.patch(f"/api/v1/blogs/{self.published_blog.id}/", payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_author_can_delete_blog(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")
        response = self.client.delete(f"/api/v1/blogs/{self.published_blog.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Blog.objects.filter(id=self.published_blog.id).exists())

    def test_non_author_cannot_delete_blog(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token2.key}")
        response = self.client.delete(f"/api/v1/blogs/{self.published_blog.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # -------------------------------------------------------------
    # My Blogs Endpoint Tests
    # -------------------------------------------------------------
    def test_my_blogs_returns_published_and_drafts(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")
        response = self.client.get("/api/v1/blogs/my-blogs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Alice has 1 published + 1 draft = 2 blogs
        self.assertEqual(len(response.data), 2)

    # -------------------------------------------------------------
    # Likes & Comments Tests
    # -------------------------------------------------------------
    def test_like_published_blog(self):
        initial_likes = self.published_blog.likes_count
        response = self.client.post(f"/api/v1/blogs/{self.published_blog.id}/like/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["likes_count"], initial_likes + 1)
        self.published_blog.refresh_from_db()
        self.assertEqual(self.published_blog.likes_count, initial_likes + 1)

    def test_cannot_like_draft_blog(self):
        response = self.client.post(f"/api/v1/blogs/{self.draft_blog.id}/like/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_comment_to_published_blog(self):
        payload = {
            "content": "Awesome article!",
            "author_name": "Dave",
        }
        response = self.client.post(
            f"/api/v1/blogs/{self.published_blog.id}/comments/", payload
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["content"], "Awesome article!")
        self.assertEqual(response.data["author_name"], "Dave")
        self.assertEqual(self.published_blog.comments.count(), 1)

    # -------------------------------------------------------------
    # Medium Claps Tests
    # -------------------------------------------------------------
    def test_claps_burst(self):
        initial_claps = self.published_blog.claps_count
        response = self.client.post(
            f"/api/v1/blogs/{self.published_blog.id}/clap/",
            {"count": 5}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["claps_count"], initial_claps + 5)
        self.published_blog.refresh_from_db()
        self.assertEqual(self.published_blog.claps_count, initial_claps + 5)

    # -------------------------------------------------------------
    # Medium Bookmarks (Reading List) Tests
    # -------------------------------------------------------------
    def test_bookmark_toggle_and_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")

        # Add bookmark
        response = self.client.post(f"/api/v1/blogs/{self.bobs_blog.id}/bookmark/")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["is_bookmarked"])

        # Check in bookmarks list
        list_resp = self.client.get("/api/v1/blogs/bookmarks/")
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_resp.data), 1)
        self.assertEqual(list_resp.data[0]["blog"], self.bobs_blog.id)

        # Remove bookmark
        del_resp = self.client.post(f"/api/v1/blogs/{self.bobs_blog.id}/bookmark/")
        self.assertEqual(del_resp.status_code, status.HTTP_200_OK)
        self.assertFalse(del_resp.data["is_bookmarked"])

        # Check list is now empty
        empty_resp = self.client.get("/api/v1/blogs/bookmarks/")
        self.assertEqual(len(empty_resp.data), 0)

    # -------------------------------------------------------------
    # Medium Author Profile & Follow Tests
    # -------------------------------------------------------------
    def test_author_profile_and_follow(self):
        # View Bob's public profile
        response = self.client.get(f"/api/v1/blogs/authors/{self.user2.username}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "bob")
        self.assertEqual(response.data["followers_count"], 0)

        # Alice follows Bob
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")
        follow_resp = self.client.post(f"/api/v1/blogs/authors/{self.user2.username}/follow/")
        self.assertEqual(follow_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(follow_resp.data["is_following"])
        self.assertEqual(follow_resp.data["followers_count"], 1)

        # Check Following Feed
        feed_resp = self.client.get("/api/v1/blogs/following/")
        self.assertEqual(feed_resp.status_code, status.HTTP_200_OK)
        titles = [b["title"] for b in feed_resp.data]
        self.assertIn("Python Clean Code", titles)

        # Alice unfollows Bob
        unfollow_resp = self.client.post(f"/api/v1/blogs/authors/{self.user2.username}/follow/")
        self.assertEqual(unfollow_resp.status_code, status.HTTP_200_OK)
        self.assertFalse(unfollow_resp.data["is_following"])
        self.assertEqual(unfollow_resp.data["followers_count"], 0)

    def test_cannot_follow_self(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")
        response = self.client.post(f"/api/v1/blogs/authors/{self.user1.username}/follow/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------
    # User Profile Update Test
    # -------------------------------------------------------------
    def test_user_profile_update(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")
        payload = {
            "bio": "Software Architect & Open Source Writer",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
            "website": "https://alice.dev",
        }
        response = self.client.patch("/api/v1/auth/profile/", payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["profile"]["bio"], "Software Architect & Open Source Writer")
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.profile.website, "https://alice.dev")

    # -------------------------------------------------------------
    # Mailer & Password Reset Tests
    # -------------------------------------------------------------
    def test_password_reset_flow(self):
        from .models import PasswordResetToken

        # Step 1: Request password reset
        req_resp = self.client.post(
            "/api/v1/auth/password-reset/",
            {"email": "alice@example.com"}
        )
        self.assertEqual(req_resp.status_code, status.HTTP_200_OK)

        reset_token = PasswordResetToken.objects.filter(user=self.user1, is_used=False).first()
        self.assertIsNotNone(reset_token)

        # Step 2: Verify token
        verify_resp = self.client.get(
            f"/api/v1/auth/password-reset/verify/?token={reset_token.token}"
        )
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_resp.data["valid"])
        self.assertEqual(verify_resp.data["username"], "alice")

        # Step 3: Confirm new password
        confirm_resp = self.client.post(
            "/api/v1/auth/password-reset/confirm/",
            {
                "token": reset_token.token,
                "new_password": "brandnewpassword123",
            }
        )
        self.assertEqual(confirm_resp.status_code, status.HTTP_200_OK)
        reset_token.refresh_from_db()
        self.assertTrue(reset_token.is_used)

        # Step 4: Login with new password
        login_resp = self.client.post(
            "/api/v1/auth/login/",
            {"username": "alice", "password": "brandnewpassword123"}
        )
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)

