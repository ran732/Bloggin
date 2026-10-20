import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { blogService, authService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'published', 'drafts'
  const [dashboardSearch, setDashboardSearch] = useState("");

  // Modal deletion state
  const [targetBlog, setTargetBlog] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Author Profile edit state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [bio, setBio] = useState(user?.profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || "");
  const [website, setWebsite] = useState(user?.profile?.website || "");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    let ignore = false;
    async function fetchMyBlogs() {
      setError("");
      try {
        const response = await blogService.getMyBlogs();
        if (!ignore) {
          const data = Array.isArray(response.data)
            ? response.data
            : (response.data?.results || []);
          setBlogs(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading author blogs:", err);
          setError("Could not load your posts. Please verify you are logged in.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (isAuthenticated) {
      fetchMyBlogs();
    }
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, authLoading, navigate]);

  // Handle Deletion
  async function confirmDelete() {
    if (!targetBlog) return;
    setDeleting(true);
    try {
      await blogService.deleteBlog(targetBlog.id);
      setBlogs((prev) => prev.filter((b) => b.id !== targetBlog.id));
      showToast(`Article "${targetBlog.title}" was deleted.`, "success");
      setTargetBlog(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      showToast("Failed to delete post. You may not have permission.", "error");
    } finally {
      setDeleting(false);
    }
  }

  // Handle Profile Update
  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await authService.updateProfile({
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        website: website.trim(),
      });
      showToast("Author profile updated successfully!", "success");
      setShowProfileModal(false);
    } catch (err) {
      console.error("Profile save error:", err);
      showToast("Failed to update profile.", "error");
    } finally {
      setProfileSaving(false);
    }
  }

  // Calculate stats
  const totalPosts = blogs.length;
  const publishedPosts = blogs.filter((b) => b.is_published).length;
  const draftPosts = totalPosts - publishedPosts;
  const totalClaps = blogs.reduce((acc, b) => acc + (b.claps_count || b.likes_count || 0), 0);
  const followersCount = user?.followers_count || 0;
  const followingCount = user?.following_count || 0;

  // Filtered and searched list
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "published" && blog.is_published) ||
        (filter === "drafts" && !blog.is_published);

      const matchesSearch =
        blog.title.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
        (blog.category && blog.category.toLowerCase().includes(dashboardSearch.toLowerCase()));

      return matchesFilter && matchesSearch;
    });
  }, [blogs, filter, dashboardSearch]);

  if (authLoading || loading) {
    return (
      <main className="container" style={{ padding: "64px 24px" }}>
        <p>Loading your author workspace...</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "48px 24px 80px" }}>
      {/* Dashboard Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div className="card-category-badge" style={{ marginBottom: "8px", display: "inline-block" }}>
            Author Workspace
          </div>
          <h1 style={{ fontSize: "2.2rem", marginBottom: "4px" }}>
            Welcome back, {user?.username} 👋
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
            Manage your stories, view audience engagement, and build your Reading List.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowProfileModal(true)}
          >
            ⚙️ Edit Bio & Profile
          </button>
          <Link to={`/author/${user?.username}`} className="btn btn-secondary">
            👁️ View Public Profile
          </Link>
          <Link to="/reading-list" className="btn btn-secondary">
            🔖 Reading List
          </Link>
          <Link to="/create" className="btn btn-primary">
            ✍️ Write New Story
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: "14px 18px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "10px", marginBottom: "28px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Analytics / Metrics Grid */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Stories</div>
          <div className="stat-value">{totalPosts}</div>
          <div className="stat-sub">{publishedPosts} published • {draftPosts} drafts</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Claps</div>
          <div className="stat-value" style={{ color: "var(--color-primary)" }}>👏 {totalClaps}</div>
          <div className="stat-sub">Reader appreciations</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Followers</div>
          <div className="stat-value" style={{ color: "#0ea5e9" }}>{followersCount}</div>
          <div className="stat-sub">Readers following you</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Following</div>
          <div className="stat-value" style={{ color: "#ec4899" }}>{followingCount}</div>
          <div className="stat-sub">Authors you follow</div>
        </div>
      </div>

      {/* Articles Management Table & Dynamic Controls */}
      <div className="dashboard-content-box">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1.3rem", margin: 0 }}>My Stories ({filteredBlogs.length})</h2>

            <div className="filter-tags" style={{ margin: 0 }}>
              <button
                type="button"
                className={`filter-tag ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All ({totalPosts})
              </button>
              <button
                type="button"
                className={`filter-tag ${filter === "published" ? "active" : ""}`}
                onClick={() => setFilter("published")}
              >
                Published ({publishedPosts})
              </button>
              <button
                type="button"
                className={`filter-tag ${filter === "drafts" ? "active" : ""}`}
                onClick={() => setFilter("drafts")}
              >
                Drafts ({draftPosts})
              </button>
            </div>
          </div>

          <div style={{ minWidth: "220px", flex: 1, maxWidth: "300px" }}>
            <input
              type="text"
              className="search-input"
              style={{ padding: "8px 12px", fontSize: "0.85rem" }}
              placeholder="Filter my articles..."
              value={dashboardSearch}
              onChange={(e) => setDashboardSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="state-box" style={{ margin: "24px 0", maxWidth: "100%" }}>
            <div className="state-icon empty">📝</div>
            <h3 className="state-title">No articles match your selection</h3>
            <p className="state-desc">
              {dashboardSearch
                ? `No articles found matching "${dashboardSearch}".`
                : filter === "drafts"
                ? "You do not have any unpublished drafts."
                : "You haven't published any articles yet. Ready to write your first story?"}
            </p>
            <Link to="/create" className="btn btn-primary">
              Write Your First Story
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Story Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th>Engagement</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id}>
                    <td>
                      <Link to={`/blog/${blog.id}`} className="table-article-title">
                        {blog.title}
                      </Link>
                    </td>
                    <td>
                      <span className="table-badge">{blog.category || "General"}</span>
                    </td>
                    <td>
                      {blog.is_published ? (
                        <span className="status-badge published">Published</span>
                      ) : (
                        <span className="status-badge draft">Draft</span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {new Date(blog.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
                        👏 {blog.claps_count || blog.likes_count || 0} &nbsp; 💬 {blog.comments_count || 0}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <Link to={`/blog/${blog.id}`} className="btn-table-action" title="View Story">
                          👁️
                        </Link>
                        <Link to={`/edit/${blog.id}`} className="btn-table-action edit" title="Edit Story">
                          ✏️
                        </Link>
                        <button
                          type="button"
                          onClick={() => setTargetBlog(blog)}
                          className="btn-table-action delete"
                          title="Delete Story"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "6px" }}>Edit Author Profile</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
              Your bio and links appear on your public author profile and beneath your published stories.
            </p>

            <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.875rem" }}>
                  Short Bio
                </label>
                <textarea
                  className="search-input"
                  rows={3}
                  style={{ padding: "10px 12px", resize: "vertical" }}
                  placeholder="Tell readers about your expertise, background, or interests..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.875rem" }}>
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  className="search-input"
                  style={{ padding: "10px 12px" }}
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.875rem" }}>
                  Personal Website or Portfolio
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ padding: "10px 12px" }}
                  placeholder="https://yourwebsite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {targetBlog && (
        <div className="modal-backdrop" onClick={() => setTargetBlog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="state-icon error" style={{ margin: "0 0 16px" }}>🗑️</div>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>Delete Article?</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "24px" }}>
              Are you sure you want to permanently delete <strong>"{targetBlog.title}"</strong>?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setTargetBlog(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
