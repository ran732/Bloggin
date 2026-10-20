import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { blogService } from "../services/api";

export default function BlogCard({ blog, viewMode = "grid" }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(blog.is_bookmarked || false);
  const [bookmarking, setBookmarking] = useState(false);

  // Approximate reading time
  const words = blog.content ? blog.content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(words / 150));

  // Formatted date
  const formattedDate = blog.created_at
    ? new Date(blog.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  // Author initial
  const authorInitial = blog.author_name
    ? blog.author_name.charAt(0).toUpperCase()
    : "A";

  const claps = blog.claps_count || blog.likes_count || 0;

  async function handleToggleBookmark(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast("Sign in to save stories to your Reading List.", "info");
      return;
    }

    if (bookmarking) return;
    setBookmarking(true);

    try {
      const response = await blogService.toggleBookmark(blog.id);
      setIsBookmarked(response.data.is_bookmarked);
      showToast(response.data.message, "success");
    } catch (err) {
      console.error("Bookmark error:", err);
      showToast("Could not update bookmark.", "error");
    } finally {
      setBookmarking(false);
    }
  }

  function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/blog/${blog.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast("Article link copied to clipboard!", "success");
    } else {
      showToast(`Link: ${url}`, "info");
    }
  }

  if (viewMode === "list") {
    return (
      <article className="blog-card blog-card-list">
        <div className="card-top-accent"></div>
        <div className="card-body" style={{ padding: "20px 24px" }}>
          <div className="card-meta-top" style={{ marginBottom: "8px" }}>
            <span className="card-category-badge">{blog.category || "Technology"}</span>
            <span className="card-read-time">⏱ {readTime} min read</span>
            {blog.tag_list && blog.tag_list.length > 0 && (
              <span className="tag-pill" style={{ fontSize: "0.75rem" }}>
                #{blog.tag_list[0]}
              </span>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "16px" }}>
            <Link to={`/blog/${blog.id}`} style={{ flex: 1 }}>
              <h3 className="card-title" style={{ fontSize: "1.2rem", margin: "0 0 6px" }}>
                {blog.title}
              </h3>
            </Link>
          </div>

          <p className="card-excerpt" style={{ margin: "0 0 14px", WebkitLineClamp: 2 }}>
            {blog.content}
          </p>

          <div className="card-footer" style={{ paddingTop: "12px" }}>
            <div className="author-info">
              <Link to={`/author/${blog.author_name}`} style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                {blog.author_avatar ? (
                  <img src={blog.author_avatar} alt="" className="author-avatar" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div className="author-avatar" style={{ width: "28px", height: "28px", fontSize: "0.75rem" }}>
                    {authorInitial}
                  </div>
                )}
                <span className="author-name">{blog.author_name || "Author"}</span>
              </Link>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>• {formattedDate}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }} title="Claps">
                👏 {claps}
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }} title="Comments">
                💬 {blog.comments_count || 0}
              </span>
              <button
                type="button"
                className={`btn-icon-subtle ${isBookmarked ? "bookmarked" : ""}`}
                onClick={handleToggleBookmark}
                title={isBookmarked ? "Saved in Reading List" : "Save to Reading List"}
                style={{ color: isBookmarked ? "var(--color-primary)" : "inherit" }}
              >
                {isBookmarked ? "🔖" : "📑"}
              </button>
              <button
                type="button"
                className="btn-icon-subtle"
                onClick={handleShare}
                title="Share link"
              >
                🔗
              </button>
              <Link to={`/blog/${blog.id}`} className="read-more-btn">
                Read <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="blog-card animate-fade-in">
      <div className="card-top-accent"></div>

      <div className="card-body">
        <div className="card-meta-top">
          <span className="card-category-badge">{blog.category || "Technology"}</span>
          <span className="card-read-time">⏱ {readTime} min read</span>
          {blog.tag_list && blog.tag_list.length > 0 && (
            <span className="tag-pill" style={{ fontSize: "0.75rem" }}>
              #{blog.tag_list[0]}
            </span>
          )}
        </div>

        <Link to={`/blog/${blog.id}`}>
          <h2 className="card-title">{blog.title}</h2>
        </Link>

        <p className="card-excerpt">{blog.content}</p>

        <div className="card-footer">
          <div className="author-info">
            <Link to={`/author/${blog.author_name}`} style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              {blog.author_avatar ? (
                <img src={blog.author_avatar} alt="" className="author-avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div className="author-avatar">{authorInitial}</div>
              )}
              <div>
                <div className="author-name">{blog.author_name || "Anonymous"}</div>
                <div className="post-date">{formattedDate}</div>
              </div>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }} title="Claps">
              👏 {claps}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }} title="Comments">
              💬 {blog.comments_count || 0}
            </span>
            <button
              type="button"
              className={`btn-icon-subtle ${isBookmarked ? "bookmarked" : ""}`}
              onClick={handleToggleBookmark}
              title={isBookmarked ? "Saved in Reading List" : "Save to Reading List"}
              style={{ color: isBookmarked ? "var(--color-primary)" : "inherit" }}
            >
              {isBookmarked ? "🔖" : "📑"}
            </button>
            <button
              type="button"
              className="btn-icon-subtle"
              onClick={handleShare}
              title="Copy link"
            >
              🔗
            </button>
            <Link to={`/blog/${blog.id}`} className="read-more-btn">
              Read <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
