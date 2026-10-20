import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { blogService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import BlogCard from "../components/BlogCard";

const CATEGORIES = [
  "Technology",
  "Programming",
  "Web Development",
  "Tutorials",
  "Career & Life",
];

export default function CreateBlog() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please fill in both the title and article content.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tags.trim(),
        is_published: isPublished,
      };

      const response = await blogService.createBlog(payload);
      const newBlog = response.data;
      navigate(`/blog/${newBlog.id}`);
    } catch (err) {

      console.error("Error creating blog post:", err);
      if (err.response?.status === 401) {
        setError("You must be logged in to publish an article.");
      } else {
        setError(
          err.response?.data?.detail ||
          "Failed to create article. Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // Mock object for live preview
  const previewBlog = {
    id: 0,
    title: title || "Your Article Title Will Appear Here",
    content: content || "Start writing your article content to preview how it looks on a card...",
    category,
    author_name: user?.username || "You",
    created_at: new Date().toISOString(),
    likes_count: 0,
    comments_count: 0,
  };

  return (
    <main className="container" style={{ maxWidth: "820px", padding: "48px 24px 80px" }}>
      <Link to="/" className="read-more-btn" style={{ marginBottom: "24px", display: "inline-flex" }}>
        ← Back to Home
      </Link>

      {!isAuthenticated && (
        <div className="state-box" style={{ maxWidth: "100%", textAlign: "left", marginBottom: "28px", borderLeft: "4px solid var(--color-primary)" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "6px" }}>🔒 Authentication Required</h3>
          <p style={{ fontSize: "0.925rem", marginBottom: "16px" }}>
            To publish an article under your name, please sign in or register an author account.
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link to="/login" className="btn btn-primary">Sign In</Link>
            <Link to="/register" className="btn btn-secondary">Create Account</Link>
          </div>
        </div>
      )}

      <div className="form-container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: "4px" }}>Write a New Article</h1>
            <p style={{ fontSize: "0.925rem" }}>
              Share your knowledge, code, and insights with readers across the web.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? "Hide Preview" : "👁️ Live Card Preview"}
          </button>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Live Preview Drawer */}
        {showPreview && (
          <div style={{ marginBottom: "28px", padding: "20px", background: "var(--bg-subtle)", borderRadius: "var(--radius-lg)" }}>
            <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-dim)", marginBottom: "12px" }}>
              Card Preview
            </h4>
            <div style={{ maxWidth: "380px" }}>
              <BlogCard blog={previewBlog} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
              Article Title *
            </label>
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: "14px", fontSize: "1.1rem" }}
              placeholder="e.g. Building Scalable Web APIs with Django and React"
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
              placeholder="e.g. React, JavaScript, WebDev, SystemDesign"
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
              rows={12}
              style={{ paddingLeft: "14px", resize: "vertical", lineHeight: "1.6" }}
              placeholder="Write your article body here... Paragraphs and code descriptions will format automatically."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox"
              id="is_published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "var(--color-primary)" }}
            />
            <label htmlFor="is_published" style={{ fontSize: "0.95rem", fontWeight: 500, cursor: "pointer" }}>
              Publish immediately (uncheck to save as a Draft in your Dashboard)
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
            <Link to="/" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !isAuthenticated}
            >
              {loading ? "Publishing..." : isPublished ? "🚀 Publish Article" : "💾 Save as Draft"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
