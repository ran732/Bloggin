import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { blogService } from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  "Technology",
  "Programming",
  "Web Development",
  "Tutorials",
  "Career & Life",
];

export default function EditBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [blogAuthor, setBlogAuthor] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function fetchBlog() {
      setError("");
      try {
        const response = await blogService.getBlog(id);
        if (!ignore) {
          const b = response.data;
          setTitle(b.title);
          setCategory(b.category || "Technology");
          setTags(b.tags || "");
          setContent(b.content);
          setIsPublished(b.is_published);
          setBlogAuthor({ id: b.author, name: b.author_name });
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading blog for edit:", err);
          setError("Article not found or could not be retrieved.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    fetchBlog();
    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleUpdate(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content cannot be blank.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tags.trim(),
        is_published: isPublished,
      };


      await blogService.updateBlog(id, payload);
      navigate(`/blog/${id}`);
    } catch (err) {
      console.error("Error updating blog post:", err);
      if (err.response?.status === 403) {
        setError("Permission denied: You can only edit your own blog posts.");
      } else {
        setError("Failed to update article. Please check your connection.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to permanently delete this blog post?")) {
      return;
    }

    setDeleting(true);
    try {
      await blogService.deleteBlog(id);
      alert("Post deleted successfully.");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error deleting blog:", err);
      alert("Failed to delete post. You may not have permission.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="container" style={{ maxWidth: "820px", padding: "64px 24px" }}>
        <p>Loading post data...</p>
      </main>
    );
  }

  const isAuthor = !blogAuthor || !user
    ? false
    : (user.id === blogAuthor.id || user.username === blogAuthor.name);

  if (!isAuthor && !loading && blogAuthor) {
    return (
      <main className="container" style={{ maxWidth: "600px", padding: "64px 24px" }}>
        <div className="state-box">
          <div className="state-icon error">🔒</div>
          <h2 className="state-title">Access Denied</h2>
          <p className="state-desc">You are only permitted to edit articles that you have authored.</p>
          <Link to={`/blog/${id}`} className="btn btn-primary">
            ← View Article
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: "820px", padding: "48px 24px 80px" }}>
      <Link to={`/blog/${id}`} className="read-more-btn" style={{ marginBottom: "24px", display: "inline-flex" }}>
        ← Back to Article
      </Link>

      <div className="form-container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: "4px" }}>Edit Article</h1>
            <p style={{ fontSize: "0.925rem" }}>
              Update your article content, category, or publication status.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "🗑️ Delete Article"}
          </button>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
              Article Title *
            </label>
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: "14px", fontSize: "1.1rem" }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
              Category
            </label>
            <select
              className="search-input"
              style={{ paddingLeft: "14px" }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
              Tags (comma separated)
            </label>
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: "14px" }}
              placeholder="e.g. React, JavaScript, WebDev"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
              Content *
            </label>

            <textarea
              className="search-input"
              rows={14}
              style={{ paddingLeft: "14px", resize: "vertical", lineHeight: "1.6" }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox"
              id="is_published_edit"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "var(--color-primary)" }}
            />
            <label htmlFor="is_published_edit" style={{ fontSize: "0.95rem", fontWeight: 500, cursor: "pointer" }}>
              Published (uncheck to revert to Draft)
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
            <Link to={`/blog/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
