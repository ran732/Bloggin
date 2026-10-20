import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { blogService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import BlogCard from "../components/BlogCard";

export default function AuthorProfile() {
  const { username } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [author, setAuthor] = useState(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [error, setError] = useState("");

  const isSelf = user?.username?.toLowerCase() === username?.toLowerCase();

  useEffect(() => {
    let ignore = false;
    async function fetchAuthorAndStories() {
      setError("");
      try {
        const [profileRes, storiesRes] = await Promise.all([
          blogService.getAuthorProfile(username),
          blogService.getBlogs({ search: username }),
        ]);

        if (!ignore) {
          setAuthor(profileRes.data);
          const allStories = Array.isArray(storiesRes.data)
            ? storiesRes.data
            : (storiesRes.data?.results || []);
          // Filter strictly by this author
          setStories(allStories.filter((s) => s.author_name?.toLowerCase() === username.toLowerCase()));
          document.title = `${profileRes.data.username} — Author on Bloggin`;
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load author profile:", err);
          setError("Author profile not found or could not be loaded.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchAuthorAndStories();
    return () => {
      ignore = true;
      document.title = "Bloggin — Full-Stack Blogging Platform";
    };
  }, [username]);

  async function handleToggleFollow() {
    if (!isAuthenticated) {
      showToast("Please sign in to follow authors.", "info");
      return;
    }
    if (isSelf || followingLoading) return;

    setFollowingLoading(true);
    try {
      const response = await blogService.toggleFollow(username);
      setAuthor((prev) => ({
        ...prev,
        is_following: response.data.is_following,
        followers_count: response.data.followers_count,
      }));
      showToast(response.data.message, "success");
    } catch (err) {
      console.error("Follow error:", err);
      showToast("Could not update follow status.", "error");
    } finally {
      setFollowingLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="container" style={{ maxWidth: "860px", padding: "64px 24px" }}>
        <div className="skeleton-line skeleton-title" style={{ width: "40%", height: "48px", marginBottom: "20px" }}></div>
        <div className="skeleton-line skeleton-text" style={{ width: "80%", marginBottom: "16px" }}></div>
        <div className="skeleton-line skeleton-text-short" style={{ width: "30%" }}></div>
      </main>
    );
  }

  if (error || !author) {
    return (
      <main className="container" style={{ maxWidth: "600px", padding: "64px 24px" }}>
        <div className="state-box">
          <div className="state-icon error">⚠️</div>
          <h2 className="state-title">{error || "Author Not Found"}</h2>
          <p className="state-desc">The author profile you are looking for does not exist.</p>
          <Link to="/" className="btn btn-primary">
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const initial = author.username ? author.username[0].toUpperCase() : "A";

  return (
    <main className="container" style={{ maxWidth: "880px", padding: "48px 24px 80px" }}>
      {/* Author Hero Header */}
      <div className="author-profile-hero">
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
          {author.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.username}
              className="author-avatar-lg"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="author-avatar-lg" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.4rem", fontWeight: 800 }}>
              {initial}
            </div>
          )}

          <div style={{ flex: 1, minWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "2.2rem", margin: 0, fontFamily: "var(--font-heading)" }}>
                {author.username}
              </h1>

              {isSelf ? (
                <Link to="/dashboard" className="btn btn-secondary">
                  ⚙️ Edit Profile
                </Link>
              ) : (
                <button
                  type="button"
                  className={`btn ${author.is_following ? "btn-secondary" : "btn-primary"}`}
                  onClick={handleToggleFollow}
                  disabled={followingLoading}
                >
                  {author.is_following ? "✓ Following" : "+ Follow Author"}
                </button>
              )}
            </div>

            <p style={{ fontSize: "1.05rem", color: "var(--text-main)", lineHeight: "1.6", margin: "0 0 16px" }}>
              {author.bio || "Writer and contributor on Bloggin."}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              <span>
                <strong style={{ color: "var(--text-main)" }}>{author.followers_count || 0}</strong> Followers
              </span>
              <span>
                <strong style={{ color: "var(--text-main)" }}>{author.following_count || 0}</strong> Following
              </span>
              <span>
                <strong style={{ color: "var(--text-main)" }}>{stories.length}</strong> Stories
              </span>
              {author.website && (
                <a
                  href={author.website.startsWith("http") ? author.website : `https://${author.website}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}
                >
                  🌐 {author.website.replace(/^https?:\/\//, "")} ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stories Section */}
      <section style={{ marginTop: "44px" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "24px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
          Stories by {author.username} ({stories.length})
        </h2>

        {stories.length === 0 ? (
          <div className="state-box" style={{ maxWidth: "100%", padding: "40px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>✍️</div>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "6px" }}>No published articles yet</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              {author.username} hasn't published any public stories yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="blog-grid">
            {stories.map((story) => (
              <BlogCard key={story.id} blog={story} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
